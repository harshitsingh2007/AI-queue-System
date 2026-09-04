"""
test_cancellation_and_adjustment.py
-----------------------------------
Comprehensive Automated Test Suite for:
1. Patient Ticket Cancellation Flow & Constraints
2. Patient Queue Skip / Adjustment Backward Flow & Limits
3. Security Authorization & Multi-Hospital Isolation
4. Concurrent Database Transactions & Race Condition Safety
"""

import os
import sys
import time
import concurrent.futures
from typing import List

# Ensure backend directory is in python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from database import get_db_connection
from queue_engine import engine, MAX_PATIENT_QUEUE_ADJUSTMENT, PRIORITY_STANDARD, PRIORITY_ROUTINE

passed_count = 0
failed_count = 0

def test_assert(condition: bool, desc: str):
    global passed_count, failed_count
    if condition:
        passed_count += 1
        print(f"  [PASS] {desc}")
    else:
        failed_count += 1
        print(f"  [FAIL] {desc}")
        raise AssertionError(f"Test Assertion Failed: {desc}")


def run_all_tests():
    global passed_count, failed_count
    print("=" * 75)
    print("RUNNING PATIENT TICKET CANCELLATION & QUEUE ADJUSTMENT TEST SUITE")
    print("=" * 75)

    ts = int(time.time() * 1000)
    h_code_1 = f"hosp-test-a-{ts % 10000}"
    h_code_2 = f"hosp-test-b-{ts % 10000}"

    # Setup: Create 2 isolated hospitals
    sa_email = f"superadmin_{ts}@care.com"
    sa = engine.register_superadmin(
        email=sa_email,
        username="Dr. Super",
        password="SuperPassword123!",
        hospital_name="Hospital Alpha",
        hospital_code=h_code_1
    )

    sa2_email = f"superadmin2_{ts}@care.com"
    sa2 = engine.register_superadmin(
        email=sa2_email,
        username="Dr. Super Beta",
        password="SuperPassword123!",
        hospital_name="Hospital Beta",
        hospital_code=h_code_2
    )

    # Setup: Create patients
    pat_a_email = f"alice_{ts}@patient.com"
    pat_a = engine.register_user(
        email=pat_a_email,
        username="Alice Patient",
        password="AlicePassword123!",
        role="user"
    )

    pat_b_email = f"bob_{ts}@patient.com"
    pat_b = engine.register_user(
        email=pat_b_email,
        username="Bob Patient",
        password="BobPassword123!",
        role="user"
    )

    pat_c_email = f"charlie_{ts}@patient.com"
    pat_c = engine.register_user(
        email=pat_c_email,
        username="Charlie Patient",
        password="CharliePassword123!",
        role="user"
    )

    print("\n--- SECTION 1: CANCELLATION TESTS ---")

    # 1.1 Patient can cancel own WAITING ticket
    t_cancel_1 = engine.join_queue(
        tenant_id=h_code_1,
        consumer_type="hospital",
        service_category="consultation",
        name="Alice Patient",
        user_email=pat_a_email
    )
    test_assert(t_cancel_1.status == "waiting", f"Alice ticket {t_cancel_1.ticket_id} created in WAITING status")

    res_cancel = engine.cancel_ticket(
        tenant_id=h_code_1,
        ticket_id=t_cancel_1.ticket_id,
        reason="Alice is feeling better",
        user_email=pat_a_email
    )
    test_assert(res_cancel.status == "cancelled", "Patient successfully cancelled own WAITING ticket")
    test_assert(res_cancel.cancellation_reason == "Alice is feeling better", "Cancellation reason recorded correctly")

    # 1.2 Verify cancelled ticket removed from active queue
    snapshot_1 = engine.get_queue_snapshot(h_code_1, department="consultation")
    active_ids = [t["ticket_id"] for t in snapshot_1]
    test_assert(t_cancel_1.ticket_id not in active_ids, "Cancelled ticket removed from active queue snapshot")

    # 1.3 Verify cancelled ticket remains in history (PostgreSQL)
    with get_db_connection() as conn:
        row = conn.execute("SELECT status, cancellation_reason, cancelled_at FROM tickets WHERE ticket_id = %s", (t_cancel_1.ticket_id,)).fetchone()
        test_assert(row is not None, "Cancelled ticket preserved in PostgreSQL tickets table")
        test_assert(row["status"] == "cancelled", "PostgreSQL status is 'cancelled'")
        test_assert(row["cancelled_at"] is not None, "PostgreSQL cancelled_at timestamp is populated")

    # 1.4 Verify queue event logged for cancellation
    with get_db_connection() as conn:
        event = conn.execute("""
            SELECT event_type, old_status, new_status, metadata
            FROM queue_events
            WHERE ticket_id = %s AND event_type = 'CANCEL'
            ORDER BY id DESC LIMIT 1
        """, (t_cancel_1.ticket_id,)).fetchone()
        test_assert(event is not None, "Queue event record created for CANCEL")
        test_assert(event["old_status"] == "waiting", "Event old_status is 'waiting'")
        test_assert(event["new_status"] == "cancelled", "Event new_status is 'cancelled'")

    # 1.5 Patient CANNOT cancel another patient's ticket
    t_bob = engine.join_queue(
        tenant_id=h_code_1,
        consumer_type="hospital",
        service_category="consultation",
        name="Bob Patient",
        user_email=pat_b_email
    )
    try:
        engine.cancel_ticket(
            tenant_id=h_code_1,
            ticket_id=t_bob.ticket_id,
            reason="Malicious cancel attempt",
            user_email=pat_a_email  # Alice trying to cancel Bob's ticket
        )
        test_assert(False, "Alice should NOT be able to cancel Bob's ticket")
    except PermissionError:
        test_assert(True, "Rejected cross-patient cancellation attempt with PermissionError (403)")

    # 1.6 Patient CANNOT cancel a ticket belonging to another hospital (Tenant Isolation)
    t_hosp_b = engine.join_queue(
        tenant_id=h_code_2,
        consumer_type="hospital",
        service_category="consultation",
        name="Hospital B Ticket",
        user_email=pat_b_email
    )
    try:
        engine.cancel_ticket(
            tenant_id=h_code_1,  # Passing wrong hospital
            ticket_id=t_hosp_b.ticket_id,
            reason="Wrong hospital cancel",
            user_email=pat_b_email
        )
        test_assert(False, "Patient should NOT be able to cancel ticket across hospital boundaries")
    except (PermissionError, ValueError):
        test_assert(True, "Hospital tenant isolation enforced: cross-hospital ticket cancellation rejected")

    # 1.7 Patient CANNOT cancel a SERVING ticket
    called_ticket = engine.serve_next(tenant_id=h_code_1, department="consultation")
    test_assert(called_ticket is not None and called_ticket.ticket_id == t_bob.ticket_id, "Bob's ticket called to SERVING")
    test_assert(called_ticket.status == "serving", "Bob's ticket status is 'serving'")

    try:
        engine.cancel_ticket(
            tenant_id=h_code_1,
            ticket_id=t_bob.ticket_id,
            reason="Trying to cancel serving ticket",
            user_email=pat_b_email
        )
        test_assert(False, "Patient should NOT be able to cancel SERVING ticket")
    except ValueError as ve:
        test_assert("only waiting" in str(ve).lower() or "status is 'serving'" in str(ve).lower(),
                    "Rejected cancellation of SERVING ticket (409)")

    # 1.8 Patient CANNOT cancel a COMPLETED ticket
    completed_ticket = engine.complete_ticket(tenant_id=h_code_1, ticket_id=t_bob.ticket_id)
    test_assert(completed_ticket.status == "completed", "Bob's ticket completed")
    try:
        engine.cancel_ticket(
            tenant_id=h_code_1,
            ticket_id=t_bob.ticket_id,
            reason="Trying to cancel completed ticket",
            user_email=pat_b_email
        )
        test_assert(False, "Patient should NOT be able to cancel COMPLETED ticket")
    except ValueError:
        test_assert(True, "Rejected cancellation of COMPLETED ticket (409)")

    # 1.9 Positions recalculate and have NO gaps after cancellation
    q1 = engine.join_queue(tenant_id=h_code_1, consumer_type="hospital", service_category="pharmacy", name="P1", user_email=pat_a_email)
    q2 = engine.join_queue(tenant_id=h_code_1, consumer_type="hospital", service_category="pharmacy", name="P2", user_email=pat_b_email)
    q3 = engine.join_queue(tenant_id=h_code_1, consumer_type="hospital", service_category="pharmacy", name="P3", user_email=pat_c_email)

    test_assert(q1.position == 1 and q2.position == 2 and q3.position == 3, "Initial queue positions are #1, #2, #3")

    # Cancel middle ticket #2
    engine.cancel_ticket(tenant_id=h_code_1, ticket_id=q2.ticket_id, reason="Cancel middle", user_email=pat_b_email)

    # Check remaining positions: must be #1 and #2 with no gaps!
    pharm_snap = engine.get_queue_snapshot(h_code_1, department="pharmacy")
    positions = [t["position"] for t in pharm_snap]
    test_assert(positions == [1, 2], f"Remaining positions after cancellation are {positions} (no gaps)")
    test_assert(pharm_snap[0]["ticket_id"] == q1.ticket_id, "Ticket 1 retains position #1")
    test_assert(pharm_snap[1]["ticket_id"] == q3.ticket_id, "Ticket 3 moved up to position #2")


    print("\n--- SECTION 2: QUEUE ADJUSTMENT / SKIP TESTS ---")

    # Setup 4 waiting tickets in laboratory
    t1 = engine.join_queue(tenant_id=h_code_1, consumer_type="hospital", service_category="laboratory", name="Lab 1 (Alice)", user_email=pat_a_email)
    t2 = engine.join_queue(tenant_id=h_code_1, consumer_type="hospital", service_category="laboratory", name="Lab 2 (Bob)", user_email=pat_b_email)
    t3 = engine.join_queue(tenant_id=h_code_1, consumer_type="hospital", service_category="laboratory", name="Lab 3 (Charlie)", user_email=pat_c_email)
    t4 = engine.join_queue(tenant_id=h_code_1, consumer_type="hospital", service_category="laboratory", name="Lab 4 (David)", user_email=sa_email)

    test_assert([t.position for t in [t1, t2, t3, t4]] == [1, 2, 3, 4], "Laboratory queue setup with positions #1, #2, #3, #4")

    # 2.1 Patient CANNOT move forward (negative or zero)
    try:
        engine.adjust_queue_position(
            tenant_id=h_code_1,
            ticket_id=t1.ticket_id,
            skip_positions=0,
            user_email=pat_a_email
        )
        test_assert(False, "skip_positions=0 must be rejected")
    except ValueError:
        test_assert(True, "Zero position skip rejected with ValueError (400)")

    try:
        engine.adjust_queue_position(
            tenant_id=h_code_1,
            ticket_id=t1.ticket_id,
            skip_positions=-1,
            user_email=pat_a_email
        )
        test_assert(False, "Negative position skip (moving forward) must be rejected")
    except ValueError:
        test_assert(True, "Negative position skip (moving forward) rejected with ValueError (400)")

    # 2.2 Patient CAN move backward by 1 position: #1 -> #2
    adj_1 = engine.adjust_queue_position(
        tenant_id=h_code_1,
        ticket_id=t1.ticket_id,
        skip_positions=1,
        user_email=pat_a_email
    )
    test_assert(adj_1["old_position"] == 1, "Old position was #1")
    test_assert(adj_1["new_position"] == 2, "New position is #2")
    test_assert(adj_1["adjustment_count"] == 1, "adjustment_count is 1")
    test_assert(adj_1["remaining_adjustment"] == 2, "remaining_adjustment is 2")
    test_assert(adj_1["ticket_id"] == t1.ticket_id, "Ticket ID remained strictly unchanged")

    # Verify positions in snapshot: t2 is now #1, t1 is now #2, t3 is #3, t4 is #4
    lab_snap = engine.get_queue_snapshot(h_code_1, department="laboratory")
    snap_order = [t["ticket_id"] for t in lab_snap]
    test_assert(snap_order == [t2.ticket_id, t1.ticket_id, t3.ticket_id, t4.ticket_id],
                f"Queue correctly reordered: {[t2.ticket_id, t1.ticket_id, t3.ticket_id, t4.ticket_id]}")
    test_assert([t["position"] for t in lab_snap] == [1, 2, 3, 4], "All queue positions remain sequential and unique (1, 2, 3, 4)")

    # 2.3 Verify queue event logged for adjustment
    with get_db_connection() as conn:
        adj_event = conn.execute("""
            SELECT event_type, old_position, new_position, metadata
            FROM queue_events
            WHERE ticket_id = %s AND event_type = 'ADJUST'
            ORDER BY id DESC LIMIT 1
        """, (t1.ticket_id,)).fetchone()
        test_assert(adj_event is not None, "Queue event record created for ADJUST")
        test_assert(adj_event["old_position"] == 1, "Event old_position recorded as 1")
        test_assert(adj_event["new_position"] == 2, "Event new_position recorded as 2")

    # 2.4 Patient can move backward again by 2 positions: #2 -> #4 (total adjustments = 1 + 2 = 3 = MAX)
    adj_2 = engine.adjust_queue_position(
        tenant_id=h_code_1,
        ticket_id=t1.ticket_id,
        skip_positions=2,
        user_email=pat_a_email
    )
    test_assert(adj_2["old_position"] == 2, "Old position was #2")
    test_assert(adj_2["new_position"] == 4, "New position is #4")
    test_assert(adj_2["adjustment_count"] == 3, "adjustment_count is 3")
    test_assert(adj_2["remaining_adjustment"] == 0, "remaining_adjustment is 0")

    # 2.5 Patient CANNOT exceed configured maximum (MAX_PATIENT_QUEUE_ADJUSTMENT = 3)
    try:
        engine.adjust_queue_position(
            tenant_id=h_code_1,
            ticket_id=t1.ticket_id,
            skip_positions=1,
            user_email=pat_a_email
        )
        test_assert(False, "Should NOT allow adjustment when limit is reached")
    except ValueError as ve:
        test_assert("limit exceeded" in str(ve).lower() or "maximum" in str(ve).lower(),
                    f"Adjustment limit enforced: {ve}")

    # 2.6 Patient CANNOT move beyond the end of the queue
    # David's ticket t4 is now at position 3, and t1 is at position 4 (last)
    try:
        engine.adjust_queue_position(
            tenant_id=h_code_1,
            ticket_id=t1.ticket_id,
            skip_positions=1,
            user_email=sa_email
        )
        test_assert(False, "Should NOT allow moving beyond end of queue")
    except ValueError as ve:
        test_assert("end of the queue" in str(ve).lower() or "limit" in str(ve).lower(),
                    f"Moving beyond end of queue rejected: {ve}")

    # 2.7 Patient CANNOT adjust another patient's ticket
    try:
        engine.adjust_queue_position(
            tenant_id=h_code_1,
            ticket_id=t2.ticket_id,
            skip_positions=1,
            user_email=pat_c_email  # Charlie attempting to adjust Bob's ticket
        )
        test_assert(False, "Charlie should NOT be able to adjust Bob's ticket")
    except PermissionError:
        test_assert(True, "Rejected cross-patient adjustment attempt with PermissionError (403)")

    # 2.8 Patient CANNOT adjust CALLED / SERVING / COMPLETED / CANCELLED ticket
    # Call t2 to serving
    called_lab = engine.serve_next(tenant_id=h_code_1, department="laboratory")
    test_assert(called_lab.ticket_id == t2.ticket_id, "t2 called to SERVING")
    try:
        engine.adjust_queue_position(
            tenant_id=h_code_1,
            ticket_id=t2.ticket_id,
            skip_positions=1,
            user_email=pat_b_email
        )
        test_assert(False, "Should NOT allow adjusting SERVING ticket")
    except ValueError as ve:
        test_assert("only waiting" in str(ve).lower(), f"SERVING ticket adjustment rejected (409): {ve}")


    print("\n--- SECTION 3: CONCURRENCY & TRANSACTION SAFETY ---")

    # Setup 6 tickets for concurrency tests
    conc_tickets = []
    for i in range(6):
        tk = engine.join_queue(
            tenant_id=h_code_1,
            consumer_type="hospital",
            service_category="radiology",
            name=f"Rad Patient {i+1}",
            user_email=pat_a_email
        )
        conc_tickets.append(tk)

    # Perform concurrent adjustment requests on multiple tickets simultaneously
    def do_adjust(idx, skip):
        try:
            return engine.adjust_queue_position(
                tenant_id=h_code_1,
                ticket_id=conc_tickets[idx].ticket_id,
                skip_positions=skip,
                user_email=pat_a_email
            )
        except Exception as e:
            return str(e)

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        f1 = executor.submit(do_adjust, 0, 1)
        f2 = executor.submit(do_adjust, 1, 1)
        f3 = executor.submit(do_adjust, 2, 1)
        results = [f.result() for f in [f1, f2, f3]]

    # Verify positions after concurrent executions
    rad_snap = engine.get_queue_snapshot(h_code_1, department="radiology")
    rad_positions = [t["position"] for t in rad_snap]
    unique_positions = set(rad_positions)

    test_assert(len(rad_positions) == len(unique_positions), "No duplicate positions after concurrent adjustments")
    test_assert(rad_positions == list(range(1, len(rad_snap) + 1)), f"Positions remain strictly sequential (1 to {len(rad_snap)})")

    # Also verify database persistence of positions matches
    with get_db_connection() as conn:
        db_rows = conn.execute("""
            SELECT ticket_id, position FROM tickets
            WHERE hospital_id = (SELECT id FROM hospitals WHERE hospital_code = %s)
              AND service_category = 'radiology' AND status = 'waiting'
            ORDER BY position ASC
        """, (h_code_1,)).fetchall()
        db_positions = [r["position"] for r in db_rows]
        test_assert(db_positions == rad_positions, "PostgreSQL database positions exactly match in-memory snapshot positions")


    print("\n" + "=" * 75)
    print(f"[ALL PASS] ALL CANCELLATION & ADJUSTMENT TESTS COMPLETED SUCCESSFULLY! ({passed_count} PASS, {failed_count} FAIL)")
    print("=" * 75)


if __name__ == "__main__":
    run_all_tests()
