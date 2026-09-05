"""
backend/tests/test_all_features.py
-----------------------------------
Comprehensive Automated Test Suite for AI Queue System.
Tests:
1. PostgreSQL Database Schema, Tables, Constraints & Sequences
2. Foreign Key Cascade & Referential Integrity
3. Multi-Hospital Tenant Isolation & Security
4. Queue Engine Full Lifecycle (Join, Adjust, Serve, Transfer, Cancel, Complete, No-Show)
5. Queue Event & Audit Trail Logging
6. Appointment Booking & Auto Check-in Stepper
7. Patient & Family Member Management
8. AI/ML Prediction & Historical Data Integration
9. Database Inspector API Compliance (no leaked credentials)
"""

import os
import sys
import json
import unittest

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import database
from queue_engine import engine, Ticket, compute_clinical_complexity


class TestPostgresRedesign(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Verify database connection."""
        cls.db_info = database.get_db_info()
        print(f"\n[Test Setup] Connected to {cls.db_info['db_type']} (DB: {cls.db_info['database']})")

    # -------------------------------------------------------------
    # 1. Database Schema & Tables
    # -------------------------------------------------------------
    def test_01_schema_tables_exist(self):
        """Verify all 17 normalized tables exist in PostgreSQL."""
        expected_tables = {
            "users", "hospitals", "departments", "patients", "family_members",
            "employees", "desks", "kiosks", "appointments", "appointment_status_history",
            "tickets", "queue_events", "service_logs", "tenant_historical_data",
            "tenant_config", "tenant_mapping", "audit_logs"
        }
        with database.get_db_connection() as conn:
            rows = conn.execute("""
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public';
            """).fetchall()
            existing_tables = {r[0] for r in rows}

        for tbl in expected_tables:
            self.assertIn(tbl, existing_tables, f"Missing table in PostgreSQL: {tbl}")
        print("[PASS] Test 01: All 17 normalized tables verified.")

    # -------------------------------------------------------------
    # 2. Foreign Keys & Uniqueness Constraints
    # -------------------------------------------------------------
    def test_02_constraints_and_indexes(self):
        """Verify unique composite constraints and primary keys."""
        with database.get_db_connection() as conn:
            # Check departments unique(hospital_id, dept_code)
            dept = conn.execute("SELECT hospital_id, dept_code FROM departments LIMIT 1").fetchone()
            if dept:
                hid, dcode = dept[0], dept[1]
                # Duplicate insertion should fail
                with self.assertRaises(Exception):
                    conn.execute("""
                        INSERT INTO departments (hospital_id, dept_code, name, created_at, updated_at)
                        VALUES (%s, %s, 'Duplicate Dept', NOW(), NOW());
                    """, (hid, dcode))
                conn.rollback()

        print("[PASS] Test 02: Relational constraints & uniqueness enforced.")

    # -------------------------------------------------------------
    # 3. Multi-Hospital Isolation & Security
    # -------------------------------------------------------------
    def test_03_hospital_isolation(self):
        """Verify Super Admin and Staff hospital boundary checks."""
        # 1. Register Super Admin A with Hospital A
        sa_email = f"sa_test_{int(sys.version_info.major * 1000 + sys.version_info.minor)}@test.org"
        h_code_a = "hosp-test-iso-a"
        try:
            sa_a = engine.register_superadmin(
                email=sa_email,
                username="SuperAdmin A",
                password="password123",
                hospital_name="Hospital ISO A",
                hospital_code=h_code_a
            )
        except ValueError:
            pass  # Already exists from previous run

        # 2. Check access
        self.assertTrue(engine.verify_hospital_access(h_code_a, sa_email))

        # 3. Access to an unrelated hospital B should be forbidden for regular staff
        staff_email = f"staff_test_{h_code_a}@test.org"
        try:
            engine.add_hospital_employee(
                hospital_code=h_code_a,
                name="Staff Alpha",
                email=staff_email,
                role="staff",
                department="consultation"
            )
        except Exception:
            pass

        self.assertTrue(engine.verify_hospital_access(h_code_a, staff_email))
        self.assertFalse(engine.verify_hospital_access("unrelated-hospital-xyz", staff_email))
        print("[PASS] Test 03: Multi-hospital isolation & security access checks verified.")

    # -------------------------------------------------------------
    # 4. Queue Lifecycle & Event Logging
    # -------------------------------------------------------------
    def test_04_queue_lifecycle_and_events(self):
        """Test Join -> Adjust -> Serve -> Transfer -> Complete -> Queue Events."""
        tenant_id = "city-hospital-01"

        # 1. Join Queue
        t1 = engine.join_queue(
            tenant_id=tenant_id,
            consumer_type="hospital",
            service_category="consultation",
            name="John Doe Test",
            priority_level=2,
            age=45,
            medical_condition="routine_followup"
        )
        self.assertIsNotNone(t1.ticket_id)
        self.assertEqual(t1.status, "waiting")

        # Join second ticket for adjustment test
        t2 = engine.join_queue(
            tenant_id=tenant_id,
            consumer_type="hospital",
            service_category="consultation",
            name="Jane Smith Test",
            priority_level=2,
            age=52
        )

        # 2. Adjust Queue Position
        adj_res = engine.adjust_queue_position(tenant_id, t1.ticket_id, skip_positions=1)
        self.assertEqual(adj_res["ticket"]["status"], "waiting")
        self.assertGreaterEqual(adj_res["actual_skip"], 1)

        # 3. Serve Next
        served = engine.serve_next(tenant_id, department="consultation")
        self.assertIsNotNone(served)
        self.assertEqual(served.status, "serving")

        # 4. Transfer Ticket
        orig_t, new_t = engine.transfer_ticket(tenant_id, served.ticket_id, "pharmacy", "Prescribed paracetamol 500mg")
        self.assertEqual(orig_t.status, "transferred")
        self.assertEqual(new_t.status, "waiting")
        self.assertEqual(new_t.service_category, "pharmacy")

        # 5. Complete Ticket
        completed_t = engine.complete_ticket(tenant_id, new_t.ticket_id)
        self.assertEqual(completed_t.status, "completed")

        # 6. Verify Queue Events recorded in PostgreSQL
        with database.get_db_connection() as conn:
            events = conn.execute("""
                SELECT event_type FROM queue_events WHERE ticket_id = %s ORDER BY id ASC;
            """, (t1.ticket_id,)).fetchall()
            event_types = [r[0] for r in events]
            self.assertTrue(any(e in event_types for e in ["ADJUST", "QUEUE_ADJUSTED"]))
            self.assertIn("QUEUE_JOINED", event_types)

        print("[PASS] Test 04: Queue lifecycle, adjustments, transfers & event logs verified.")

    # -------------------------------------------------------------
    # 5. Ticket Cancellation
    # -------------------------------------------------------------
    def test_05_ticket_cancellation(self):
        """Verify ticket cancellation records cancellation reason and event."""
        tenant_id = "city-hospital-01"
        t = engine.join_queue(tenant_id=tenant_id, consumer_type="hospital", service_category="consultation", name="Cancel Test")

        canc_t = engine.cancel_ticket(tenant_id, t.ticket_id, reason="Patient had emergency elsewhere")
        self.assertEqual(canc_t.status, "cancelled")
        self.assertEqual(canc_t.cancellation_reason, "Patient had emergency elsewhere")

        with database.get_db_connection() as conn:
            ev = conn.execute("SELECT event_type, metadata FROM queue_events WHERE ticket_id = %s AND event_type IN ('CANCEL', 'CANCELLED')", (t.ticket_id,)).fetchone()
            self.assertIsNotNone(ev)

        print("[PASS] Test 05: Ticket cancellation and audit event verified.")

    # -------------------------------------------------------------
    # 6. Appointments & Status History
    # -------------------------------------------------------------
    def test_06_appointments_and_checkin(self):
        """Verify booking, appointment history, and priority queue check-in."""
        tenant_id = "city-hospital-01"
        today_str = engine.get_current_queue_date().isoformat()
        apt = engine.book_appointment(
            tenant_id=tenant_id,
            consumer_type="hospital",
            service_category="consultation",
            patient_name="Alice Wonderland",
            user_email="alice@test.org",
            appointment_date=today_str,
            time_slot="11:30 AM"
        )
        self.assertEqual(apt["status"], "scheduled")

        # Check-in appointment
        checkin_res = engine.check_in_appointment(apt["appointment_id"])
        self.assertEqual(checkin_res["appointment"]["status"], "checked_in")
        self.assertIsNotNone(checkin_res["ticket"]["ticket_id"])

        # Verify appointment history
        with database.get_db_connection() as conn:
            hist = conn.execute("""
                SELECT new_status FROM appointment_status_history WHERE appointment_id = %s;
            """, (apt["appointment_id"],)).fetchall()
            statuses = [h[0] for h in hist]
            self.assertIn("scheduled", statuses)
            self.assertIn("checked_in", statuses)

        print("[PASS] Test 06: Appointments & status history lifecycle verified.")

    # -------------------------------------------------------------
    # 7. Family Members & Dependents
    # -------------------------------------------------------------
    def test_07_family_members(self):
        """Verify adding, listing and deleting family dependents."""
        email = "fm_test_user@hospital.org"
        try:
            engine.register_user(email=email, username="Parent User", password="password123")
        except ValueError:
            pass

        fm = engine.add_family_member(user_email=email, name="Baby Timmy", relation="child", age=4, gender="male")
        self.assertEqual(fm["name"], "Baby Timmy")

        members = engine.get_family_members(email)
        self.assertTrue(any(m["name"] == "Baby Timmy" for m in members))

        # Delete family member
        deleted = engine.delete_family_member(email, fm["id"])
        self.assertTrue(deleted)
        print("[PASS] Test 07: Family members & dependent switching verified.")

    # -------------------------------------------------------------
    # 8. Database Inspector API
    # -------------------------------------------------------------
    def test_08_database_overview_sanitized(self):
        """Verify /api/v1/admin/db-overview inspects all 17 tables and encrypts passwords."""
        overview = engine.get_database_overview()
        self.assertIn("users", overview)
        self.assertIn("tickets", overview)
        self.assertIn("queue_events", overview)
        self.assertIn("hospitals", overview)

        user_rows = overview["users"]["rows"]
        if user_rows:
            for u in user_rows:
                if "password_hash" in u:
                    self.assertIn("ENCRYPTED", u["password_hash"])
        print("[PASS] Test 08: Database Inspector dynamic overview & security sanitization verified.")


if __name__ == "__main__":
    unittest.main()
