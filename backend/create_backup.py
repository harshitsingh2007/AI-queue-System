import os
import shutil
import json
import database

os.makedirs("backups", exist_ok=True)

# 1. Backup SQLite database
if os.path.exists("queue_system.db"):
    shutil.copy2("queue_system.db", "backups/queue_system_pre_migration.db")
    print("[OK] SQLite backup created: backups/queue_system_pre_migration.db")

# 2. Export PostgreSQL tables to JSON backup
pg_backup = {}
if database.IS_POSTGRES:
    with database.get_db_connection() as conn:
        tables = [
            "users", "hospitals", "departments", "desks", "kiosks",
            "tenant_config", "tenant_mapping", "tickets", "appointments",
            "service_logs", "tenant_historical_data", "family_members"
        ]
        for t in tables:
            try:
                rows = conn.execute(f"SELECT * FROM {t}").fetchall()
                pg_backup[t] = [dict(r) for r in rows]
                print(f"[OK] PG table {t}: backed up {len(rows)} records")
            except Exception as e:
                print(f"[WARN] Error on PG {t}: {e}")

    with open("backups/pg_pre_migration.json", "w", encoding="utf-8") as f:
        json.dump(pg_backup, f, default=str, indent=2)
    print("[OK] PostgreSQL JSON backup created: backups/pg_pre_migration.json")
