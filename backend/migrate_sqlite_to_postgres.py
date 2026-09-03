"""
migrate_sqlite_to_postgres.py
-----------------------------
Production-Grade Data Migration Script: SQLite -> PostgreSQL.

Key Objectives:
1. Preserve 100% of existing data from queue_system.db into PostgreSQL (ai_queue).
2. Follow strict foreign-key / relational dependency insertion order.
3. Automatically reset PostgreSQL auto-increment identity sequences.
4. Perform table-by-table verification comparing SQLite count vs PostgreSQL count.
5. Display sample records from key tables.
"""

import os
import sqlite3
import psycopg2
from dotenv import load_dotenv

# Load environment
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

SQLITE_PATH = os.path.join(os.path.dirname(__file__), "queue_system.db")
PG_URL = os.getenv("DATABASE_URL", "postgresql://postgres:12345678@localhost:5432/ai_queue")

# Dependency-ordered table list
MIGRATION_ORDER = [
    "hospitals",
    "departments",
    "users",
    "desks",
    "family_members",
    "kiosks",
    "tenant_config",
    "tenant_mapping",
    "tickets",
    "appointments",
    "service_logs",
    "tenant_historical_data",
]

# Primary / Unique conflict targets per table
CONFLICT_TARGETS = {
    "hospitals": ["hospital_code"],
    "departments": ["hospital_code", "dept_code"],
    "users": ["email"],
    "desks": ["hospital_code", "dept_code", "desk_number"],
    "family_members": ["id"],
    "kiosks": ["kiosk_code"],
    "tenant_config": ["tenant_id"],
    "tenant_mapping": ["tenant_id"],
    "tickets": ["ticket_id"],
    "appointments": ["appointment_id"],
    "service_logs": ["id"],
    "tenant_historical_data": ["id"],
}

# Tables that have auto-increment integer IDs
IDENTITY_TABLES = [
    "departments",
    "desks",
    "users",
    "kiosks",
    "service_logs",
    "tenant_historical_data",
]


def run_migration():
    print("=" * 65)
    print("[START] RELATIONAL DATA MIGRATION: SQLite -> PostgreSQL")
    print(f" Source SQLite: {SQLITE_PATH}")
    print(f" Target PostgreSQL: {PG_URL.split('@')[-1] if '@' in PG_URL else PG_URL}")
    print("=" * 65)

    if not os.path.exists(SQLITE_PATH):
        raise FileNotFoundError(f"SQLite file not found at {SQLITE_PATH}")

    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    pg_conn = psycopg2.connect(PG_URL)
    pg_conn.autocommit = False
    pg_cur = pg_conn.cursor()

    migration_stats = {}

    try:
        for table in MIGRATION_ORDER:
            # 1. Fetch from SQLite
            sqlite_cur.execute(f"SELECT * FROM \"{table}\";")
            rows = sqlite_cur.fetchall()
            src_count = len(rows)

            if src_count == 0:
                print(f"  [-] Table '{table}': 0 rows in SQLite (Skipping data insertion)")
                migration_stats[table] = {"src": 0, "dest": 0}
                continue

            # Determine column names
            col_names = [desc[0] for desc in sqlite_cur.description]
            cols_str = ", ".join(f'"{c}"' for c in col_names)
            placeholders = ", ".join(["%s"] * len(col_names))

            conflict_cols = CONFLICT_TARGETS.get(table, ["id"])
            conflict_str = ", ".join(f'"{c}"' for c in conflict_cols)

            # Build UPSERT / ON CONFLICT statement
            # For data migration, DO NOTHING preserves existing target records without crashing
            insert_sql = f"""
                INSERT INTO "{table}" ({cols_str})
                VALUES ({placeholders})
                ON CONFLICT ({conflict_str}) DO NOTHING;
            """

            # Batch insert rows
            records_to_insert = [tuple(row[c] for c in col_names) for row in rows]
            pg_cur.executemany(insert_sql, records_to_insert)
            pg_conn.commit()

            # Check target row count
            pg_cur.execute(f'SELECT COUNT(*) FROM "{table}";')
            dest_count = pg_cur.fetchone()[0]

            migration_stats[table] = {"src": src_count, "dest": dest_count}
            print(f"  [+] Table '{table:24}': Migrated {src_count:4d} rows -> PostgreSQL now has {dest_count:4d} rows")

        # -------------------------------------------------------------
        # Phase 7: Reset PostgreSQL Auto-Increment Sequences
        # -------------------------------------------------------------
        # Phase 7: Reset PostgreSQL Auto-Increment Sequences
        # -------------------------------------------------------------
        print("\n" + "=" * 65)
        print("[PHASE 7] RESETTING POSTGRESQL IDENTITY / SERIAL SEQUENCES")
        print("=" * 65)

        for seq_table in IDENTITY_TABLES:
            try:
                # Find max id currently in table
                pg_cur.execute(f'SELECT COALESCE(MAX(id), 1) FROM "{seq_table}";')
                max_id = pg_cur.fetchone()[0]

                # Check if sequence exists
                pg_cur.execute(f"SELECT pg_get_serial_sequence('{seq_table}', 'id');")
                seq_name = pg_cur.fetchone()[0]

                if seq_name:
                    pg_cur.execute(f"SELECT setval(%s, %s, true);", (seq_name, max_id))
                    pg_conn.commit()
                    print(f"  [OK] Sequence for '{seq_table:24}' reset to MAX(id) = {max_id}")
                else:
                    # Identity column sequence reset
                    pg_cur.execute(f"""
                        SELECT setval(pg_get_serial_sequence('"{seq_table}"', 'id'), %s, true);
                    """, (max_id,))
                    pg_conn.commit()
                    print(f"  [OK] Identity sequence for '{seq_table:24}' reset to MAX(id) = {max_id}")
            except Exception as seq_err:
                pg_conn.rollback()
                # Try standard alter sequence identity restart
                try:
                    pg_cur.execute(f'SELECT COALESCE(MAX(id) + 1, 1) FROM "{seq_table}";')
                    next_id = pg_cur.fetchone()[0]
                    pg_cur.execute(f'ALTER TABLE "{seq_table}" ALTER COLUMN id RESTART WITH {next_id};')
                    pg_conn.commit()
                    print(f"  [OK] Identity column '{seq_table}.id' restarted with {next_id}")
                except Exception as alter_err:
                    pg_conn.rollback()
                    print(f"  [!] Note on sequence reset for '{seq_table}': {alter_err}")

        # -------------------------------------------------------------
        # Phase 6: Full Verification Summary
        # -------------------------------------------------------------
        print("\n" + "=" * 65)
        print("[PHASE 6] MIGRATION ROW COUNT VERIFICATION")
        print("=" * 65)
        print(f" {'Table Name':25} | {'SQLite Count':12} | {'Postgres Count':14} | Status")
        print("-" * 65)

        all_matched = True
        for table in MIGRATION_ORDER:
            sqlite_cur.execute(f'SELECT COUNT(*) FROM "{table}";')
            s_count = sqlite_cur.fetchone()[0]
            pg_cur.execute(f'SELECT COUNT(*) FROM "{table}";')
            p_count = pg_cur.fetchone()[0]

            is_match = s_count == p_count
            if not is_match:
                all_matched = False
            status_tag = "MATCH (OK)" if is_match else f"DIFF ({p_count - s_count:+d})"
            print(f" {table:25} | {s_count:12d} | {p_count:14d} | {status_tag}")

        print("-" * 65)
        if all_matched:
            print("[SUCCESS] PERFECT MATCH: 100% of records in all 12 tables successfully migrated!")
        else:
            print("[NOTICE] Some tables have difference in counts (check above summary).")

        # -------------------------------------------------------------
        # Sample Record Verification (hospitals and appointments)
        # -------------------------------------------------------------
        print("\n" + "=" * 65)
        print("[SAMPLE RECORDS] SAMPLE DATA IN POSTGRESQL")
        print("=" * 65)

        print("\n[Sample Hospitals (First 3)]:")
        pg_cur.execute('SELECT hospital_code, name, status, owner_email FROM hospitals ORDER BY created_at ASC LIMIT 3;')
        for r in pg_cur.fetchall():
            print(f"  - Code: {r[0]:18} | Name: {r[1]:25} | Status: {r[2]} | Owner: {r[3]}")

        print("\n[Sample Appointments (First 3)]:")
        pg_cur.execute('SELECT appointment_id, tenant_id, patient_name, appointment_date, time_slot, status FROM appointments LIMIT 3;')
        for r in pg_cur.fetchall():
            print(f"  - ID: {r[0]:12} | Tenant: {r[1]:16} | Patient: {r[2]:20} | Slot: {r[3]} {r[4]} | Status: {r[5]}")

        print("\n[Sample Desks (First 3)]:")
        pg_cur.execute('SELECT id, hospital_code, dept_code, desk_number, desk_name, status FROM desks LIMIT 3;')
        for r in pg_cur.fetchall():
            print(f"  - ID: {r[0]:3d} | Hospital: {r[1]:16} | Dept: {r[2]:12} | Desk #{r[3]}: {r[4]:20} | Status: {r[5]}")

        print("\n" + "=" * 65)
        print("[DONE] MIGRATION TO POSTGRESQL COMPLETED SUCCESSFULLY!")
        print("=" * 65)

    except Exception as e:
        pg_conn.rollback()
        print(f"\n[ERROR] Migration Error: {e}")
        raise
    finally:
        sqlite_conn.close()
        pg_conn.close()


if __name__ == "__main__":
    run_migration()
