"""
clear_test_queue.py
-------------------
Cleans up dummy test data from the active queue and resets today's live queue.
"""

import database
from queue_engine import engine

def clear_dummy_test_data():
    with database.get_db_connection() as conn:
        # 1. Cancel / Complete all waiting dummy tickets from test suites
        conn.execute("""
            UPDATE tickets
            SET status = 'completed', position = NULL, updated_at = NOW()
            WHERE status IN ('waiting', 'serving', 'called')
              AND (
                name ILIKE '%test%'
                OR name ILIKE '%dummy%'
                OR name ILIKE '%alice%'
                OR name ILIKE '%bob%'
                OR name ILIKE '%carol%'
                OR name ILIKE '%dave%'
                OR name ILIKE '%john doe%'
                OR name ILIKE '%jane doe%'
                OR name ILIKE '%patient%'
                OR name ILIKE '%rad patient%'
                OR name ILIKE '%lab%'
                OR name ILIKE '%p1%'
                OR name ILIKE '%p2%'
                OR name ILIKE '%p3%'
                OR name ILIKE '%a1%'
                OR name ILIKE '%a2%'
                OR name ILIKE '%a3%'
                OR name = 'user'
              );
        """)

        # 2. Clean up any remaining waiting tickets created during testing
        conn.execute("""
            UPDATE tickets
            SET status = 'completed', position = NULL, updated_at = NOW()
            WHERE status IN ('waiting', 'serving', 'called');
        """)

        # 3. Clean up test appointments created during testing
        conn.execute("""
            UPDATE appointments
            SET status = 'completed', updated_at = NOW()
            WHERE status IN ('scheduled', 'checked_in');
        """)

        # 4. Clean up test hospital records created during tests
        conn.execute("""
            DELETE FROM hospitals
            WHERE hospital_code LIKE 'test-hosp-%'
               OR hospital_code LIKE 'hosp-life-%'
               OR hospital_code LIKE 'hosp-test-%'
               OR hospital_code LIKE 'other-hosp-%';
        """)

    # Re-hydrate all in-memory queues
    engine._hydrate_from_db()

    snap = engine.get_queue_snapshot("city-hospital-01")
    serving = engine.get_serving_tickets("city-hospital-01")
    print(f"[CLEANUP COMPLETE] City Hospital Queue - Waiting: {len(snap)}, Serving: {len(serving)}")

if __name__ == "__main__":
    clear_dummy_test_data()
