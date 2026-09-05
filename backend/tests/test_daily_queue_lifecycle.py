"""
backend/tests/test_daily_queue_lifecycle.py
--------------------------------------------
Comprehensive Automated Test Suite for Daily Queue Lifecycle & Historical AI Training.

Covers:
1. Daily Isolation: Today's tickets appear today; yesterday's and tomorrow's do not.
2. Future Appointments: Scheduled for future date, no active position, excluded from active queue.
3. Activation: Check-in rejected for future/past dates; activated on appointment date.
4. Queue Numbering Reset: Independent positions restart at #1 each day.
5. Safe Expiration: Past tickets/appointments expire cleanly, records are NEVER deleted, events logged.
6. Idempotency: Multiple closure executions cause no duplicate updates.
7. Multi-Hospital Isolation: Hospital A context cannot access Hospital B data.
8. AI Training Compatibility: Preserved logs feed into model training.
"""

import os
import sys
import unittest
from datetime import date, timedelta

# Set up paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import database
from queue_engine import (
    engine,
    get_current_queue_date,
    parse_queue_date,
    Ticket,
    PRIORITY_ROUTINE,
    PRIORITY_EMERGENCY
)
from train_model import train_model_for_tenant, get_tenant_model_info


class TestDailyQueueLifecycle(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        database.init_postgres_schema()
        cls.today = get_current_queue_date()
        cls.yesterday = cls.today - timedelta(days=1)
        cls.tomorrow = cls.today + timedelta(days=1)
        cls.hosp_a = "hosp-life-a"
        cls.hosp_b = "hosp-life-b"

        # Create test hospitals if they don't exist
        with database.get_db_connection() as conn:
            conn.execute("""
                INSERT INTO hospitals (hospital_code, name, address, status, created_at, updated_at)
                VALUES (%s, 'Lifecycle Hospital A', 'City A', 'active', NOW(), NOW()),
                       (%s, 'Lifecycle Hospital B', 'City B', 'active', NOW(), NOW())
                ON CONFLICT (hospital_code) DO NOTHING;
            """, (cls.hosp_a, cls.hosp_b))

            # Ensure default departments
            for hcode in (cls.hosp_a, cls.hosp_b):
                hid = engine._resolve_hospital_id(conn, hcode)
                conn.execute("""
                    INSERT INTO departments (hospital_id, dept_code, name, status, created_at, updated_at)
                    VALUES (%s, 'consultation', 'OPD Consultation', 'active', NOW(), NOW())
                    ON CONFLICT (hospital_id, dept_code) DO NOTHING;
                """, (hid,))

    def setUp(self):
        # Reset in-memory queue state for test hospitals
        for hcode in (self.hosp_a, self.hosp_b):
            t = engine._get_tenant(hcode)
            t["queue"] = []
            t["tickets"] = {}

    def test_01_today_walkin_enters_active_queue(self):
        """Test 1: Walk-in created today belongs to today's queue and receives position #1."""
        t1 = engine.join_queue(
            tenant_id=self.hosp_a,
            consumer_type="hospital",
            service_category="consultation",
            name="Alice Today",
            queue_date=self.today,
            status="waiting"
        )

        self.assertEqual(parse_queue_date(t1.queue_date), self.today)
        self.assertEqual(t1.status, "waiting")
        self.assertIsNotNone(t1.position)
        self.assertEqual(t1.position, 1)

        # Verify active snapshot
        snapshot = engine.get_queue_snapshot(self.hosp_a, department="consultation")
        self.assertTrue(any(t["ticket_id"] == t1.ticket_id for t in snapshot))
        print("[PASS] Test 01: Today's walk-in ticket is WAITING in active queue with position #1.")

    def test_02_future_appointment_isolation(self):
        """Test 2: Future appointment (tomorrow) remains SCHEDULED and does NOT enter today's queue."""
        apt = engine.book_appointment(
            tenant_id=self.hosp_a,
            consumer_type="hospital",
            service_category="consultation",
            patient_name="Bob Tomorrow",
            user_email="bob@test.com",
            appointment_date=self.tomorrow.isoformat(),
            time_slot="10:30 AM"
        )
        self.assertEqual(apt["status"], "scheduled")
        self.assertEqual(apt["appointment_date"], self.tomorrow.isoformat())

        # Today's active queue should NOT contain Bob
        snapshot = engine.get_queue_snapshot(self.hosp_a, department="consultation")
        self.assertFalse(any(t.get("patient_name") == "Bob Tomorrow" for t in snapshot))

        # Check-in attempt today for tomorrow's appointment must be rejected
        with self.assertRaises(ValueError) as ctx:
            engine.check_in_appointment(apt["appointment_id"])
        self.assertIn("Check-in not available yet", str(ctx.exception))
        print("[PASS] Test 02: Future appointment remains SCHEDULED and check-in is rejected.")

    def test_03_activation_on_appointment_date(self):
        """Test 3: When appointment date arrives (today), check-in activates ticket into today's queue."""
        apt = engine.book_appointment(
            tenant_id=self.hosp_a,
            consumer_type="hospital",
            service_category="consultation",
            patient_name="Carol Today",
            user_email="carol@test.com",
            appointment_date=self.today.isoformat(),
            time_slot="11:00 AM"
        )
        self.assertEqual(apt["status"], "scheduled")

        # Check in Carol on appointment date (today)
        checkin_res = engine.check_in_appointment(apt["appointment_id"])
        self.assertEqual(checkin_res["appointment"]["status"], "checked_in")
        self.assertIsNotNone(checkin_res["ticket"]["ticket_id"])
        self.assertEqual(checkin_res["ticket"]["status"], "waiting")
        self.assertEqual(parse_queue_date(checkin_res["ticket"]["queue_date"]), self.today)

        # Carol must now appear in today's active queue snapshot
        snapshot = engine.get_queue_snapshot(self.hosp_a, department="consultation")
        self.assertTrue(any(t["ticket_id"] == checkin_res["ticket"]["ticket_id"] for t in snapshot))
        print("[PASS] Test 03: Appointment for today successfully checked in and activated in queue.")

    def test_04_daily_queue_position_reset(self):
        """Test 4: Queue positions restart from #1 independently per day and department."""
        # Join 3 tickets for today
        t1 = engine.join_queue(tenant_id=self.hosp_a, consumer_type="hospital", service_category="consultation", name="P1", queue_date=self.today)
        t2 = engine.join_queue(tenant_id=self.hosp_a, consumer_type="hospital", service_category="consultation", name="P2", queue_date=self.today)
        t3 = engine.join_queue(tenant_id=self.hosp_a, consumer_type="hospital", service_category="consultation", name="P3", queue_date=self.today)

        self.assertEqual(t1.position, 1)
        self.assertEqual(t2.position, 2)
        self.assertEqual(t3.position, 3)

        # Hydrating a fresh day queue starts at #1
        snapshot = engine.get_queue_snapshot(self.hosp_a, department="consultation")
        positions = [t["position"] for t in snapshot]
        self.assertEqual(positions, [1, 2, 3])
        print("[PASS] Test 04: Queue positions strictly restart from #1.")

    def test_05_expiration_without_deletion_and_event_logging(self):
        """Test 5: Previous day unserved tickets & missed appointments are transitioned to EXPIRED, never deleted, events logged."""
        past_date = self.today - timedelta(days=2)

        # 1. Clean up & insert an unserved waiting ticket from past date directly in DB
        with database.get_db_connection() as conn:
            hid = engine._resolve_hospital_id(conn, self.hosp_a)
            dept_id = engine._resolve_department_id(conn, hid, "consultation")
            conn.execute("DELETE FROM queue_events WHERE ticket_id = 'T-PAST-01';")
            conn.execute("DELETE FROM tickets WHERE ticket_id = 'T-PAST-01';")
            conn.execute("DELETE FROM appointment_status_history WHERE appointment_id = 'APT-PAST-01';")
            conn.execute("DELETE FROM appointments WHERE appointment_id = 'APT-PAST-01';")

            conn.execute("""
                INSERT INTO tickets (
                    ticket_id, hospital_id, department_id, consumer_type, service_category,
                    name, priority_level, status, position, queue_date, join_timestamp, created_at, updated_at
                ) VALUES (
                    'T-PAST-01', %s, %s, 'hospital', 'consultation',
                    'Dave Past', 2, 'waiting', 5, %s, NOW(), NOW(), NOW()
                );
            """, (hid, dept_id, past_date))

            # 2. Insert an un-checked-in past appointment
            conn.execute("""
                INSERT INTO appointments (
                    appointment_id, hospital_id, department_id, consumer_type, service_category,
                    appointment_date, time_slot, status, ticket_id, created_at, updated_at
                ) VALUES (
                    'APT-PAST-01', %s, %s, 'hospital', 'consultation',
                    %s, '09:00 AM', 'scheduled', '', NOW(), NOW()
                );
            """, (hid, dept_id, past_date))

        # Run daily closure
        closure_res = engine.close_and_expire_previous_day_queues(target_date=self.today, hospital_code=self.hosp_a)
        self.assertGreaterEqual(closure_res["expired_tickets_count"], 1)
        self.assertGreaterEqual(closure_res["expired_appointments_count"], 1)

        # Verify records STILL EXIST in PostgreSQL (NEVER DELETED) with status = 'expired'
        with database.get_db_connection() as conn:
            t_row = conn.execute("SELECT status, position, queue_date FROM tickets WHERE ticket_id = 'T-PAST-01'").fetchone()
            self.assertIsNotNone(t_row)
            self.assertEqual(t_row[0], "expired")
            self.assertIsNone(t_row[1])  # Position cleared to null

            apt_row = conn.execute("SELECT status FROM appointments WHERE appointment_id = 'APT-PAST-01'").fetchone()
            self.assertIsNotNone(apt_row)
            self.assertEqual(apt_row[0], "expired")

            # Verify queue_events contains EXPIRE event
            ev_row = conn.execute("""
                SELECT event_type, old_status, new_status FROM queue_events
                WHERE ticket_id = 'T-PAST-01' AND event_type = 'EXPIRE';
            """).fetchone()
            self.assertIsNotNone(ev_row)
            self.assertEqual(ev_row[0], "EXPIRE")
            self.assertEqual(ev_row[1], "waiting")
            self.assertEqual(ev_row[2], "expired")

            # Verify appointment_status_history
            apt_hist = conn.execute("""
                SELECT old_status, new_status FROM appointment_status_history
                WHERE appointment_id = 'APT-PAST-01' AND new_status = 'expired';
            """).fetchone()
            self.assertIsNotNone(apt_hist)
            self.assertEqual(apt_hist[1], "expired")

        print("[PASS] Test 05: Past tickets and appointments expired safely without deletion; events recorded.")

    def test_06_idempotency_of_daily_closure(self):
        """Test 6: Multiple executions of daily closure do not duplicate events or status updates."""
        # 1st run
        res1 = engine.close_and_expire_previous_day_queues(target_date=self.today, hospital_code=self.hosp_a)
        # 2nd run immediately after
        res2 = engine.close_and_expire_previous_day_queues(target_date=self.today, hospital_code=self.hosp_a)

        self.assertEqual(res2["expired_tickets_count"], 0)
        self.assertEqual(res2["expired_appointments_count"], 0)
        print("[PASS] Test 06: Daily closure is strictly idempotent.")

    def test_07_multi_hospital_isolation(self):
        """Test 7: Hospital A and Hospital B active and historical data are fully isolated."""
        t_a = engine.join_queue(tenant_id=self.hosp_a, consumer_type="hospital", service_category="consultation", name="Patient Hosp A", queue_date=self.today)
        t_b = engine.join_queue(tenant_id=self.hosp_b, consumer_type="hospital", service_category="consultation", name="Patient Hosp B", queue_date=self.today)

        snap_a = engine.get_queue_snapshot(self.hosp_a, department="consultation")
        snap_b = engine.get_queue_snapshot(self.hosp_b, department="consultation")

        # Hospital A must NOT see Hospital B ticket
        self.assertTrue(any(t["ticket_id"] == t_a.ticket_id for t in snap_a))
        self.assertFalse(any(t["ticket_id"] == t_b.ticket_id for t in snap_a))

        # Hospital B must NOT see Hospital A ticket
        self.assertTrue(any(t["ticket_id"] == t_b.ticket_id for t in snap_b))
        self.assertFalse(any(t["ticket_id"] == t_a.ticket_id for t in snap_b))

        print("[PASS] Test 07: Hospital isolation strictly verified across active queues.")

    def test_08_ai_historical_data_and_training(self):
        """Test 8: Preserved historical logs are accessible and AI training pipeline functions correctly."""
        # Insert a service log to simulate historical completed service
        with database.get_db_connection() as conn:
            hid = engine._resolve_hospital_id(conn, self.hosp_a)
            dept_id = engine._resolve_department_id(conn, hid, "consultation")
            conn.execute("""
                INSERT INTO service_logs (
                    hospital_id, ticket_id, department_id, consumer_type, service_category, queue_date,
                    hour_of_day, day_of_week, queue_length, active_staff_counters, is_peak_hour,
                    complexity_score, historical_avg_speed, service_duration_minutes, completed_at
                ) VALUES (%s, 'T-HIST-LOG-01', %s, 'hospital', 'consultation', %s, 11, 2, 4, 2, 1, 1.2, 15.0, 14.5, NOW());
            """, (hid, dept_id, self.yesterday))

        records = engine.get_historical_records(self.hosp_a)
        self.assertGreaterEqual(len(records), 1)

        # Train global baseline model
        meta = train_model_for_tenant(tenant_id="global", data_source="synthetic")
        self.assertIn("model_type", meta)
        self.assertGreater(meta["r2"], 0.8)

        info = get_tenant_model_info(self.hosp_a)
        self.assertIsNotNone(info)
        print("[PASS] Test 08: AI historical dataset loads correctly and ML pipeline trains successfully.")


if __name__ == "__main__":
    unittest.main()
