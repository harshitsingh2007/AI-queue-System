import os
from database import get_db_connection

def clean_dummy_hospitals():
    with get_db_connection() as conn:
        tables = [r[0] for r in conn.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'").fetchall()]
        print("Existing tables:", tables)

        # Query all hospitals
        h_rows = conn.execute("SELECT id, hospital_code, name, status, owner_user_id FROM hospitals ORDER BY id ASC").fetchall()
        print("\nCurrent hospitals in DB:")
        for h in h_rows:
            print(dict(h))

        # Identify dummy hospitals (test patterns)
        dummy_patterns = ['apex-care-%', 'metro-health-%', 'hosp-life-%']
        for pat in dummy_patterns:
            matches = conn.execute("SELECT id, hospital_code, name FROM hospitals WHERE hospital_code LIKE %s", (pat,)).fetchall()
            for m in matches:
                h_id = m['id']
                h_code = m['hospital_code']
                print(f"Deleting dummy hospital {h_code} (id={h_id})...")
                
                # Check each table before deleting
                for tbl in ["service_logs", "tickets", "appointments", "desks", "hospital_employees", "departments", "kiosks", "tenant_mapping", "tenant_config"]:
                    if tbl in tables:
                        try:
                            conn.execute(f"DELETE FROM {tbl} WHERE hospital_id = %s", (h_id,))
                        except Exception as e:
                            print(f"  Failed deleting from {tbl}: {e}")
                
                conn.execute("DELETE FROM hospitals WHERE id = %s", (h_id,))
                print(f"  Successfully deleted hospital {h_code}")

        print("\nRemaining hospitals after cleanup:")
        for h in conn.execute("SELECT id, hospital_code, name, status, owner_user_id FROM hospitals ORDER BY id ASC").fetchall():
            print(dict(h))

if __name__ == "__main__":
    clean_dummy_hospitals()
