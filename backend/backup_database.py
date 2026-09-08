import os
import json
import database

os.makedirs("backups", exist_ok=True)
backup = {}
with database.get_db_connection() as conn:
    tables = [
        "users", "hospitals", "departments", "patients", "family_members",
        "employees", "desks", "kiosks", "appointments", "appointment_status_history",
        "tickets", "queue_events", "service_logs", "tenant_historical_data",
        "tenant_config", "tenant_mapping", "audit_logs"
    ]
    for t in tables:
        try:
            rows = conn.execute(f"SELECT * FROM {t}").fetchall()
            backup[t] = [dict(r) for r in rows]
            print(f"[OK] {t}: {len(rows)} rows backed up")
        except Exception as e:
            print(f"[ERR] {t}: {e}")

with open("backups/pg_backup_before_dummy_cleanup.json", "w", encoding="utf-8") as f:
    json.dump(backup, f, default=str, indent=2)

print("\nBackup complete: backups/pg_backup_before_dummy_cleanup.json")
