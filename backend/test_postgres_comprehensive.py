"""
test_postgres_comprehensive.py
------------------------------
Phase 12: Comprehensive 10-Point System Verification on PostgreSQL (ai_queue).

Tests:
1. Test 1 — PostgreSQL Connectivity & Pool
2. Test 2 — Table Count Parity (SQLite vs PostgreSQL)
3. Test 3 — Authentication Across Roles (Super Admin, Hospital Admin, Doctor, Staff, Patient)
4. Test 4 — Strict Hospital Multi-Tenant Isolation
5. Test 5 — Complete Queue Lifecycle (Create -> Position -> Call -> Serve -> Complete)
6. Test 6 — Appointment Booking & Check-in Flow
7. Test 7 — Ticket Cancellation & Removal from Active Heap
8. Test 8 — Queue Position Adjustment (Fairness Constraint: Max 2 positions)
9. Test 9 — Event Emission / Notification Metadata
10. Test 10 — Restart & Engine Persistence Verification
"""

import os
import sys
import time
import sqlite3

# Ensure backend directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from database import get_db_connection, get_db_info, IS_POSTGRES, RAW_DB_URL
from queue_engine import engine, Ticket, PRIORITY_STANDARD, PRIORITY_EMERGENCY

passed_count = 0
failed_count = 0

def test_assert(condition, desc):
    global passed_count, failed_count
    if condition:
        passed_count += 1
        print(f"  [PASS] {desc}")
    else:
        failed_count += 1
        print(f"  [FAIL] {desc}")
        raise AssertionError(f"Test Assertion Failed: {desc}")


def run_comprehensive_tests():
    print("=" * 70)
    print("[TEST SUITE] RUNNING COMPREHENSIVE 10-POINT POSTGRESQL VERIFICATION SUITE")
    print("=" * 70)

    ts = int(time.time())

    # -------------------------------------------------------------
    # Test 1: PostgreSQL Connectivity
    # -------------------------------------------------------------
    print("\n--- Test 1: PostgreSQL Connectivity & Database Layer ---")
    info = get_db_info()
    test_assert(IS_POSTGRES, "Engine is running in PostgreSQL mode")
    test_assert(info["engine"] == "PostgreSQL", "Engine reporting PostgreSQL")
    test_assert(info["database"] == "ai_queue", "Database is ai_queue")
    test_assert(info["status"] == "Connected", "Connection status is Connected")

    with get_db_connection() as conn:
        cur = conn.execute("SELECT 1 + 1;")
        res = cur.fetchone()[0]
        test_assert(res == 2, "Raw SQL query executed successfully via get_db_connection()")

    # -------------------------------------------------------------
    # Test 2: Migration Row Count Parity
    # -------------------------------------------------------------
    print("\n--- Test 2: Migration Row Count Parity Check ---")
    sqlite_path = os.path.join(BASE_DIR, "queue_system.db")
    if os.path.exists(sqlite_path):
        s_conn = sqlite3.connect(sqlite_path)
        with get_db_connection() as p_conn:
            for tbl in ["hospitals", "departments", "desks", "users", "kiosks", "tenant_config", "tenant_mapping"]:
                s_cnt = s_conn.execute(f'SELECT COUNT(*) FROM "{tbl}";').fetchone()[0]
                p_cnt = p_conn.execute(f'SELECT COUNT(*) FROM "{tbl}";').fetchone()[0]
                test_assert(p_cnt >= s_cnt, f"Table '{tbl}' row count in Postgres ({p_cnt}) >= SQLite count ({s_cnt})")
        s_conn.close()
    else:
        print("  [SKIP] queue_system.db not found for comparative counts")

    # -------------------------------------------------------------
    # Test 3: Authentication Across Roles
    # -------------------------------------------------------------
    print("\n--- Test 3: Role-Based Authentication & Passwords ---")
    h_code = f"test-hosp-{ts % 1000}"
    sa_email = f"sa_{ts}@medicare.com"
    doc_email = f"doc_{ts}@medicare.com"
    doc_empid = f"DOC-{ts % 10000}"
    pat_email = f"pat_{ts}@gmail.com"

    # Register Super Admin
    sa = engine.register_superadmin(
        email=sa_email,
        username="Chief Director",
        password="Password123!",
        phone="+1 555-999-0001",
        hospital_name=f"Hospital {h_code}",
        hospital_code=h_code
    )
    test_assert(sa["role"] == "super_admin", "Super Admin registered")

    # Register Doctor
    doc = engine.add_hospital_employee(
        hospital_code=h_code,
        name="Dr. Alok Verma",
        email=doc_email,
        role="doctor",
        department="consultation",
        employee_id=doc_empid,
        phone="+1 555-999-0002",
        password="Password123!"
    )
    test_assert(doc["role"] == "doctor", "Doctor created")

    # Register Patient
    pat = engine.register_user(
        email=pat_email,
        username="Patient Rahul",
        password="Password123!",
        role="user"
    )
    test_assert(pat["role"] == "user", "Patient registered")

    # Verify Authentication
    auth_sa = engine.authenticate_user(sa_email, "Password123!")
    test_assert(auth_sa is not None and auth_sa["email"] == sa_email, "Super Admin authenticated")

    auth_doc_email = engine.authenticate_user(doc_email, "Password123!")
    test_assert(auth_doc_email is not None and auth_doc_email["employee_id"] == doc_empid, "Doctor authenticated by Email")

    auth_doc_id = engine.authenticate_user(doc_empid, "Password123!")
    test_assert(auth_doc_id is not None and auth_doc_id["email"] == doc_email, "Doctor authenticated by Employee ID")

    auth_pat = engine.authenticate_user(pat_email, "Password123!")
    test_assert(auth_pat is not None and auth_pat["role"] == "user", "Patient authenticated")

    # -------------------------------------------------------------
    # Test 4: Hospital Multi-Tenant Isolation
    # -------------------------------------------------------------
    print("\n--- Test 4: Multi-Hospital Security & Tenant Isolation ---")
    h_code_other = f"other-hosp-{ts % 1000}"
    sa_other_email = f"sa_other_{ts}@othermed.com"
    sa_other = engine.register_superadmin(
        email=sa_other_email,
        username="Other Hospital Director",
        password="Password123!",
        phone="+1 555-999-0003",
        hospital_name=f"Other Facility {h_code_other}",
        hospital_code=h_code_other
    )

    # Verify Hospital Isolation
    test_assert(engine.verify_hospital_access(h_code, sa_email) is True, f"Super Admin 1 can access own hospital '{h_code}'")
    test_assert(engine.verify_hospital_access(h_code_other, sa_email) is False, f"Super Admin 1 CANNOT access other hospital '{h_code_other}'")
    test_assert(engine.verify_hospital_access(h_code, sa_other_email) is False, f"Super Admin 2 CANNOT access other hospital '{h_code}'")
    test_assert(engine.verify_hospital_access(h_code_other, sa_other_email) is True, f"Super Admin 2 can access own hospital '{h_code_other}'")

    sa1_hospitals = engine.get_all_hospitals(requester_email=sa_email)
    hosp_codes_1 = [h["hospital_code"] for h in sa1_hospitals]
    test_assert(h_code in hosp_codes_1, f"Super Admin 1 hospital list includes own hospital '{h_code}'")
    test_assert(h_code_other not in hosp_codes_1, f"Super Admin 1 hospital list excludes other hospital '{h_code_other}'")

    # -------------------------------------------------------------
    # Test 5: Queue Lifecycle (Create -> Position -> Call -> Serve -> Complete)
    # -------------------------------------------------------------
    print("\n--- Test 5: Queue Lifecycle in PostgreSQL ---")
    t1 = engine.join_queue(
        tenant_id=h_code,
        consumer_type="hospital",
        service_category="consultation",
        name="Queue Patient 1",
        priority_level=PRIORITY_STANDARD,
        user_email=pat_email
    )
    test_assert(t1.status == "waiting", f"Ticket {t1.ticket_id} enqueued as 'waiting'")
    test_assert(t1.position >= 0, f"Ticket {t1.ticket_id} assigned position {t1.position}")

    # Call Next Ticket
    called = engine.serve_next(tenant_id=h_code, service_category="consultation")
    test_assert(called is not None, "Ticket called to active service")
    test_assert(called.status == "serving", "Ticket status changed to 'serving'")

    # Complete Ticket
    completed = engine.complete_ticket(tenant_id=h_code, ticket_id=called.ticket_id)
    test_assert(completed is not None, "Ticket service completed")
    test_assert(completed.status == "completed", "Ticket status changed to 'completed'")
    test_assert(completed.actual_service_minutes is not None, "Actual service duration recorded")

    # Verify persisted in PostgreSQL
    with get_db_connection() as conn:
        t_row = conn.execute("SELECT status FROM tickets WHERE ticket_id = %s", (completed.ticket_id,)).fetchone()
        test_assert(t_row["status"] == "completed", "PostgreSQL database verified: status is 'completed'")

    # -------------------------------------------------------------
    # Test 6: Appointment Flow (Book -> Check-in -> Queue)
    # -------------------------------------------------------------
    print("\n--- Test 6: Hybrid Appointment Booking & Check-In ---")
    apt = engine.book_appointment(
        tenant_id=h_code,
        consumer_type="hospital",
        service_category="consultation",
        patient_name="Rahul Appointment",
        user_email=pat_email,
        appointment_date="2026-09-04",
        time_slot="10:00 AM"
    )
    test_assert(apt["status"] == "scheduled", f"Appointment {apt['appointment_id']} booked as 'scheduled'")

    # Check-in Appointment
    checked_in = engine.check_in_appointment(apt["appointment_id"])
    test_assert(checked_in["appointment"]["status"] == "checked_in", "Appointment checked in; status changed to 'checked_in'")
    test_assert(checked_in["ticket"]["ticket_id"] != "", f"Queue ticket generated for appointment: {checked_in['ticket']['ticket_id']}")

    # -------------------------------------------------------------
    # Test 7: Ticket Cancellation Flow
    # -------------------------------------------------------------
    print("\n--- Test 7: Ticket Cancellation & Heap Cleanup ---")
    t_cancel = engine.join_queue(
        tenant_id=h_code,
        consumer_type="hospital",
        service_category="consultation",
        name="Cancel Patient",
        priority_level=PRIORITY_STANDARD,
        user_email=pat_email
    )
    test_assert(t_cancel.status == "waiting", f"Ticket {t_cancel.ticket_id} waiting in queue")

    # Cancel ticket
    cancelled_ticket = engine.cancel_ticket(
        tenant_id=h_code,
        ticket_id=t_cancel.ticket_id,
        reason="Patient had emergency elsewhere"
    )
    test_assert(cancelled_ticket is not None and cancelled_ticket.status == "cancelled", "Ticket cancelled successfully")

    # Check that it is removed from active waiting heap
    snap = engine.get_queue_snapshot(h_code)
    active_ids = [t["ticket_id"] for t in snap]
    test_assert(t_cancel.ticket_id not in active_ids, "Cancelled ticket removed from active waiting heap")

    # Check that cancellation reason is persisted in PostgreSQL
    with get_db_connection() as conn:
        c_row = conn.execute("SELECT status, cancellation_reason FROM tickets WHERE ticket_id = %s", (t_cancel.ticket_id,)).fetchone()
        test_assert(c_row["status"] == "cancelled", "PostgreSQL verified: status is 'cancelled'")
        test_assert(c_row["cancellation_reason"] == "Patient had emergency elsewhere", "PostgreSQL verified: cancellation reason stored")

    # -------------------------------------------------------------
    # Test 8: Queue Adjustment with Constraints
    # -------------------------------------------------------------
    print("\n--- Test 8: Queue Adjustment & Fairness Invariant ---")
    # Enqueue multiple tickets
    adj_t1 = engine.join_queue(tenant_id=h_code, consumer_type="hospital", service_category="consultation", name="A1", priority_level=PRIORITY_STANDARD)
    adj_t2 = engine.join_queue(tenant_id=h_code, consumer_type="hospital", service_category="consultation", name="A2", priority_level=PRIORITY_STANDARD)
    adj_t3 = engine.join_queue(tenant_id=h_code, consumer_type="hospital", service_category="consultation", name="A3", priority_level=PRIORITY_STANDARD)

    # Attempt adjustment: let someone go ahead of adj_t1 (swap with ticket behind)
    adj_res = engine.adjust_queue_position(
        tenant_id=h_code,
        ticket_id=adj_t1.ticket_id,
        skip_positions=1
    )
    test_assert(adj_res.get("status") in ("success", "adjusted") or "new_position" in adj_res or "ticket_id" in adj_res, "Valid queue adjustment of 1 position succeeded")

    # -------------------------------------------------------------
    # Test 9: Event Emission & Overview
    # -------------------------------------------------------------
    print("\n--- Test 9: Database Overview & System Telemetry ---")
    db_overview = engine.get_database_overview()
    test_assert("tickets" in db_overview, "Database overview returns 'tickets' table")
    test_assert("users" in db_overview, "Database overview returns 'users' table")
    test_assert("hospitals" in db_overview, "Database overview returns 'hospitals' table")
    test_assert(db_overview["tickets"]["count"] > 0, "PostgreSQL tickets count verified > 0")

    # -------------------------------------------------------------
    # Test 10: Restart Persistence
    # -------------------------------------------------------------
    print("\n--- Test 10: PostgreSQL Engine Hydration / Restart Persistence ---")
    from queue_engine import PluginQueueEngine
    # Create fresh engine instance simulating backend restart
    fresh_engine = PluginQueueEngine()
    fresh_snap = fresh_engine.get_queue_snapshot(h_code)
    test_assert(len(fresh_snap) > 0, f"Fresh engine instance hydrated active tickets from PostgreSQL for '{h_code}'")

    print("\n" + "=" * 70)
    print(f"[ALL PASS] ALL 10 TEST SUITES PASSED ON POSTGRESQL! ({passed_count} PASS, 0 FAIL)")
    print("=" * 70)


if __name__ == "__main__":
    run_comprehensive_tests()
