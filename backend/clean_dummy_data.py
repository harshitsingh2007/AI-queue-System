"""
clean_dummy_data.py
-------------------
Removes all dummy / automated test data from the database,
leaving ONLY authentic hospitals, authentic users, authentic tickets,
authentic patients, authentic departments, and authentic desks.
"""

import database

AUTHENTIC_HOSPITAL_IDS = [2, 16, 85, 124]
AUTHENTIC_USER_EMAILS = [
    'patient@hospital.com',
    'newuser@hospital.com',
    'harish123@gmail.com',
    'admin@gmial.com',
    'user@gmail.com',
    'user@gmial.com',
    'pharma@gmail.com',
    'superadmin@hospital.com',
    'superadmin2@hospital.com',
    'superadmin33@hospital.com',
    'aman@gmail.com',
    'superadmin22@hospital.com',
    'harshit2006@gmaill.com',
    'harsh22@gmail.com',
    'rajaharsih@gmail.com',
    'raj@gmail.com',
    'raja@gmail.com'
]

def clean():
    with database.get_db_connection() as conn:
        print("=== COMMENCING AUTHENTIC DATABASE PURIFY ===")

        # 1. Identify Dummy Hospitals
        all_hospitals = conn.execute("SELECT id, hospital_code, name FROM hospitals").fetchall()
        dummy_hospitals = [h for h in all_hospitals if h['id'] not in AUTHENTIC_HOSPITAL_IDS]
        dummy_hospital_ids = [h['id'] for h in dummy_hospitals]
        print(f"\n[HOSPITALS] Keeping {len(AUTHENTIC_HOSPITAL_IDS)} authentic hospitals.")
        print(f"[HOSPITALS] Removing {len(dummy_hospital_ids)} dummy test hospitals: {[h['hospital_code'] for h in dummy_hospitals[:10]]}...")

        # 2. Identify Dummy Users
        all_users = conn.execute("SELECT id, email, username FROM users").fetchall()
        authentic_user_ids = [u['id'] for u in all_users if u['email'].lower() in [e.lower() for e in AUTHENTIC_USER_EMAILS]]
        dummy_users = [u for u in all_users if u['id'] not in authentic_user_ids]
        dummy_user_ids = [u['id'] for u in dummy_users]
        print(f"\n[USERS] Keeping {len(authentic_user_ids)} authentic users.")
        print(f"[USERS] Removing {len(dummy_user_ids)} dummy test users.")

        # 3. Clean Child Tables linked to dummy hospitals or dummy users
        
        # 3a. Service logs
        if dummy_hospital_ids:
            res = conn.execute("DELETE FROM service_logs WHERE hospital_id = ANY(%s)", (dummy_hospital_ids,))
            print(f"[SERVICE_LOGS] Cleaned {res} records.")

        # 3b. Queue events
        if dummy_hospital_ids:
            res = conn.execute("DELETE FROM queue_events WHERE hospital_id = ANY(%s)", (dummy_hospital_ids,))
            print(f"[QUEUE_EVENTS] Cleaned {res} records.")

        # 3c. Appointment status history
        # Linked via appointment_id
        if dummy_hospital_ids:
            dummy_appts = conn.execute("SELECT appointment_id FROM appointments WHERE hospital_id = ANY(%s)", (dummy_hospital_ids,)).fetchall()
            dummy_appt_ids = [a['appointment_id'] for a in dummy_appts]
            if dummy_appt_ids:
                res = conn.execute("DELETE FROM appointment_status_history WHERE appointment_id = ANY(%s)", (dummy_appt_ids,))
                print(f"[APPT_HISTORY] Cleaned {res} records.")

        # 3d. Appointments
        if dummy_hospital_ids:
            res = conn.execute("DELETE FROM appointments WHERE hospital_id = ANY(%s)", (dummy_hospital_ids,))
            print(f"[APPOINTMENTS] Cleaned {res} records from dummy hospitals.")
        
        # Also clean any dummy test patient appointments in remaining hospitals
        dummy_appt_names = ['Test Appointment Patient', 'Past Appointment Patient', 'Today Patient', 'Future Patient']
        res = conn.execute("""
            DELETE FROM appointments 
            WHERE patient_id IN (SELECT id FROM patients WHERE name = ANY(%s))
        """, (dummy_appt_names,))
        print(f"[APPOINTMENTS] Cleaned {res} appointments matching dummy patient names.")

        # 3e. Tickets
        # Delete tickets in dummy hospitals
        if dummy_hospital_ids:
            res = conn.execute("DELETE FROM tickets WHERE hospital_id = ANY(%s)", (dummy_hospital_ids,))
            print(f"[TICKETS] Cleaned {res} tickets from dummy hospitals.")

        # Delete any tickets matching dummy test patient names in authentic hospitals
        dummy_ticket_names = [
            'Patient One', 'Patient Two', 'Patient Three', 
            'Patient Normal 1', 'Patient Normal 2', 'Emergency Patient 3', 
            'Past Patient', 'Today Patient', 'Test Appointment Patient', 
            'Socket Patient', 'Live Verification Patient'
        ]
        res = conn.execute("DELETE FROM tickets WHERE name = ANY(%s)", (dummy_ticket_names,))
        print(f"[TICKETS] Cleaned {res} tickets matching dummy test names.")

        # 3f. Desks
        if dummy_hospital_ids:
            res = conn.execute("DELETE FROM desks WHERE hospital_id = ANY(%s)", (dummy_hospital_ids,))
            print(f"[DESKS] Cleaned {res} desks from dummy hospitals.")

        # 3g. Kiosks
        if dummy_hospital_ids:
            res = conn.execute("DELETE FROM kiosks WHERE hospital_id = ANY(%s)", (dummy_hospital_ids,))
            print(f"[KIOSKS] Cleaned {res} kiosks from dummy hospitals.")

        # 3h. Departments
        if dummy_hospital_ids:
            res = conn.execute("DELETE FROM departments WHERE hospital_id = ANY(%s)", (dummy_hospital_ids,))
            print(f"[DEPARTMENTS] Cleaned {res} departments from dummy hospitals.")

        # 3i. Employees
        if dummy_hospital_ids:
            res = conn.execute("DELETE FROM employees WHERE hospital_id = ANY(%s)", (dummy_hospital_ids,))
            print(f"[EMPLOYEES] Cleaned {res} employees from dummy hospitals.")
        if dummy_user_ids:
            res = conn.execute("DELETE FROM employees WHERE user_id = ANY(%s)", (dummy_user_ids,))
            print(f"[EMPLOYEES] Cleaned {res} employees linked to dummy users.")

        # 3j. Tenant Config & Mapping & Historical Data
        if dummy_hospital_ids:
            conn.execute("DELETE FROM tenant_config WHERE hospital_id = ANY(%s)", (dummy_hospital_ids,))
            conn.execute("DELETE FROM tenant_mapping WHERE hospital_id = ANY(%s)", (dummy_hospital_ids,))
            conn.execute("DELETE FROM tenant_historical_data WHERE hospital_id = ANY(%s)", (dummy_hospital_ids,))
            print("[CONFIG/MAPPING] Cleaned dummy tenant configs, mappings & historical data.")

        # 3k. Audit logs
        if dummy_hospital_ids or dummy_user_ids:
            conn.execute("""
                DELETE FROM audit_logs 
                WHERE (hospital_id IS NOT NULL AND hospital_id = ANY(%s))
                   OR (user_id IS NOT NULL AND user_id = ANY(%s))
            """, (dummy_hospital_ids, dummy_user_ids))
            print("[AUDIT_LOGS] Cleaned dummy audit logs.")

        # 3l. Family members
        # Delete test family members (like Tommy Doe Jr. or linked to dummy users)
        conn.execute("DELETE FROM family_members WHERE name = 'Tommy Doe Jr.' OR user_id = ANY(%s)", (dummy_user_ids,))
        print("[FAMILY_MEMBERS] Cleaned dummy family members.")

        # 3m. Patients
        # Delete patients associated with dummy users or dummy patient names
        dummy_patient_names = [
            'Aarav Alpha Jr.', 'John Node Patient', 'Test Appointment Patient', 
            'Socket Patient', 'Patient One', 'Patient Two', 'Patient Three', 
            'Past Appointment Patient', 'Today Patient', 'Future Patient', 
            'Live Verification Patient', 'Tommy Doe Jr.'
        ]
        conn.execute("""
            DELETE FROM patients 
            WHERE (user_id IS NOT NULL AND user_id = ANY(%s))
               OR name = ANY(%s)
        """, (dummy_user_ids, dummy_patient_names))
        print("[PATIENTS] Cleaned dummy patients.")

        # 4. Delete Dummy Hospitals
        if dummy_hospital_ids:
            res = conn.execute("DELETE FROM hospitals WHERE id = ANY(%s)", (dummy_hospital_ids,))
            print(f"[HOSPITALS] Deleted {res} dummy hospitals.")

        # 5. Delete Dummy Users
        if dummy_user_ids:
            res = conn.execute("DELETE FROM users WHERE id = ANY(%s)", (dummy_user_ids,))
            print(f"[USERS] Deleted {res} dummy users.")

        print("\n=== PURIFICATION COMPLETE ===")

        # Verification summary
        print("\n--- REMAINING AUTHENTIC SUMMARY ---")
        h_rem = conn.execute("SELECT id, hospital_code, name, status FROM hospitals ORDER BY id").fetchall()
        print(f"Hospitals ({len(h_rem)}):")
        for h in h_rem:
            print(f"  - [{h['id']}] {h['hospital_code']} : {h['name']}")

        u_rem = conn.execute("SELECT id, email, username, role, status FROM users ORDER BY id").fetchall()
        print(f"\nUsers ({len(u_rem)}):")
        for u in u_rem:
            print(f"  - [{u['id']}] {u['email']} ({u['username']}) - Role: {u['role']}")

        t_rem = conn.execute("SELECT id, ticket_id, hospital_id, name, status FROM tickets ORDER BY id").fetchall()
        print(f"\nTickets ({len(t_rem)}):")
        for t in t_rem:
            print(f"  - [{t['id']}] #{t['ticket_id']} (Hosp {t['hospital_id']}): {t['name']} [{t['status']}]")

        a_rem = conn.execute("SELECT a.id, a.appointment_id, a.hospital_id, a.status FROM appointments a ORDER BY a.id").fetchall()
        print(f"\nAppointments ({len(a_rem)}):")
        for a in a_rem:
            print(f"  - [{a['id']}] {a['appointment_id']} (Hosp {a['hospital_id']}) [{a['status']}]")

        f_rem = conn.execute("SELECT id, name, relation, user_id FROM family_members").fetchall()
        print(f"\nFamily Members ({len(f_rem)}):")
        for f in f_rem:
            print(f"  - {f['name']} ({f['relation']}) for user {f['user_id']}")

        e_rem = conn.execute("SELECT id, name, employee_code, hospital_id FROM employees").fetchall()
        print(f"\nEmployees ({len(e_rem)}):")
        for e in e_rem:
            print(f"  - {e['name']} ({e['employee_code']}) in Hosp {e['hospital_id']}")

if __name__ == "__main__":
    clean()
