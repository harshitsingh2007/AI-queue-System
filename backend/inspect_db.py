import database
import json

def inspect():
    db_info = database.get_db_info()
    print("==================================================")
    print(" POSTGRESQL DATABASE INSPECTOR")
    print("==================================================")
    print(f"Engine:   {db_info['engine']}")
    print(f"Database: {db_info['database']}")
    print(f"Host:     {db_info['host']}:{db_info['port']}")
    print(f"Status:   {db_info['status']}")

    with database.get_db_connection() as conn:
        tables = [
            "users", "hospitals", "departments", "patients", "family_members",
            "employees", "desks", "kiosks", "appointments", "appointment_status_history",
            "tickets", "queue_events", "service_logs", "tenant_historical_data",
            "tenant_config", "tenant_mapping", "audit_logs"
        ]

        print(f"\nTables Found ({len(tables)}): {tables}\n")

        for table in tables:
            print(f"--------------------------------------------------")
            print(f" TABLE: {table}")
            print(f"--------------------------------------------------")
            schema = conn.execute(f"""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = '{table}'
                ORDER BY ordinal_position ASC;
            """).fetchall()

            print("Columns:")
            for col in schema:
                print(f"  - {col['column_name']} ({col['data_type']})")

            count = conn.execute(f"SELECT count(*) FROM {table};").fetchone()[0]
            print(f"\nTotal Records: {count}")

            preview_q = f"SELECT * FROM {table} LIMIT 3"
            rows = conn.execute(preview_q).fetchall()
            if rows:
                print("Sample Rows (First 3):")
                for idx, r in enumerate(rows, 1):
                    row_d = dict(r)
                    if "password_hash" in row_d:
                        row_d["password_hash"] = "•••••••••••• [ENCRYPTED]"
                    print(f"  [{idx}] {row_d}")
            else:
                print("  (Table is empty)")
            print()

if __name__ == "__main__":
    inspect()
