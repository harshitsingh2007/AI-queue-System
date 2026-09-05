import database
from queue_engine import engine

def fix_and_expire():
    with database.get_db_connection() as conn:
        conn.execute("""
            UPDATE tickets
            SET queue_date = COALESCE(
                (SELECT a.appointment_date FROM appointments a WHERE a.appointment_id = tickets.appointment_id),
                (tickets.created_at AT TIME ZONE 'Asia/Kolkata')::date,
                (tickets.join_timestamp AT TIME ZONE 'Asia/Kolkata')::date,
                CURRENT_DATE
            );
        """)
        conn.execute("""
            UPDATE service_logs
            SET queue_date = COALESCE(
                (completed_at AT TIME ZONE 'Asia/Kolkata')::date,
                CURRENT_DATE
            );
        """)

    # Close and expire previous days
    res = engine.close_and_expire_previous_day_queues()
    print("Daily closure executed:", res)

    # Re-hydrate active in-memory queues
    engine._hydrate_from_db()
    
    snap = engine.get_queue_snapshot("city-hospital-01")
    print(f"Active tickets for city-hospital-01 today: {len(snap)}")
    for t in snap:
        print(f"  {t['ticket_id']} | {t['name']} | {t['service_category']} | Date: {t['queue_date']} | Pos: #{t['position']}")

if __name__ == "__main__":
    fix_and_expire()
