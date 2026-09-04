from fastapi.testclient import TestClient
from main import app
from database import get_db_connection

client = TestClient(app)

def test_family_profiles_full_flow():
    # Setup test users
    user_email = "patient_family_test@example.com"
    other_user_email = "patient_other@example.com"
    doctor_email = "doctor_test@example.com"
    admin_email = "admin_test@example.com"

    with get_db_connection() as conn:
        cur = conn.cursor()
        # Ensure users exist with appropriate roles
        cur.execute("DELETE FROM appointments WHERE patient_id IN (SELECT id FROM patients WHERE name = 'Tommy Doe Jr.');")
        cur.execute("DELETE FROM tickets WHERE name IN ('Tommy Doe Jr.', 'Jane Doe');")
        cur.execute("DELETE FROM patients WHERE name IN ('Tommy Doe Jr.', 'Tommy Doe', 'Jane Doe');")
        cur.execute("DELETE FROM users WHERE email IN (%s, %s, %s, %s);", (user_email, other_user_email, doctor_email, admin_email))
        cur.execute("INSERT INTO users (email, username, password_hash, role, status) VALUES (%s, %s, %s, %s, %s);", (user_email, "test_patient", "hash", "user", "active"))
        cur.execute("INSERT INTO users (email, username, password_hash, role, status) VALUES (%s, %s, %s, %s, %s);", (other_user_email, "other_patient", "hash", "user", "active"))
        cur.execute("INSERT INTO users (email, username, password_hash, role, status) VALUES (%s, %s, %s, %s, %s);", (doctor_email, "doc_test", "hash", "doctor", "active"))
        cur.execute("INSERT INTO users (email, username, password_hash, role, status) VALUES (%s, %s, %s, %s, %s);", (admin_email, "admin_test", "hash", "admin", "active"))
        conn.commit()
        cur.close()

    # 1. Role Restriction Verification: Doctor and Admin should be rejected (403)
    res_doc = client.get("/api/v1/family-members", headers={"X-User-Email": doctor_email})
    assert res_doc.status_code == 403, f"Expected 403 for doctor role, got {res_doc.status_code}"

    res_admin = client.post("/api/v1/family-members", json={
        "name": "Admin Child",
        "relation": "Child",
        "gender": "male",
        "age": 10
    }, headers={"X-User-Email": admin_email})
    assert res_admin.status_code == 403, f"Expected 403 for admin role, got {res_admin.status_code}"

    # 2. Patient user flow: Fetch empty family list
    res = client.get("/api/v1/family-members", headers={"X-User-Email": user_email})
    assert res.status_code == 200
    assert res.json().get("members") == []

    # 3. Add Family Members (Mother, Father, Child)
    mother_data = {
        "name": "Jane Doe",
        "relation": "Mother",
        "gender": "female",
        "age": 55,
        "phone": "9876543210"
    }
    res_mother = client.post("/api/v1/family-members", json=mother_data, headers={"X-User-Email": user_email})
    assert res_mother.status_code == 200, res_mother.text
    mother = res_mother.json().get("member")
    assert mother["name"] == "Jane Doe"
    assert mother["relation"] == "Mother"
    assert mother["phone"] == "9876543210"
    mother_id = mother["id"]

    child_data = {
        "name": "Tommy Doe",
        "relation": "Child",
        "gender": "male",
        "age": 8,
        "phone": ""
    }
    res_child = client.post("/api/v1/family-members", json=child_data, headers={"X-User-Email": user_email})
    assert res_child.status_code == 200, res_child.text
    child = res_child.json().get("member")
    child_id = child["id"]

    # 4. List family members
    res_list = client.get("/api/v1/family-members", headers={"X-User-Email": user_email})
    assert res_list.status_code == 200
    members = res_list.json().get("members", [])
    assert len(members) == 2
    assert any(m["id"] == mother_id for m in members)
    assert any(m["id"] == child_id for m in members)

    # 5. Edit family member (Update child age & name)
    update_data = {
        "name": "Tommy Doe Jr.",
        "relation": "Child",
        "gender": "male",
        "age": 9,
        "phone": "9123456780"
    }
    res_update = client.put(f"/api/v1/family-members/{child_id}", json=update_data, headers={"X-User-Email": user_email})
    assert res_update.status_code == 200
    assert res_update.json().get("member")["age"] == 9
    assert res_update.json().get("member")["name"] == "Tommy Doe Jr."
    assert res_update.json().get("member")["phone"] == "9123456780"

    # 6. Cross-User Isolation: Other patient cannot edit or delete User's family member
    res_cross_edit = client.put(f"/api/v1/family-members/{child_id}", json=update_data, headers={"X-User-Email": other_user_email})
    assert res_cross_edit.status_code in [403, 404]

    res_cross_delete = client.delete(f"/api/v1/family-members/{child_id}", headers={"X-User-Email": other_user_email})
    assert res_cross_delete.status_code in [403, 404]

    # 7. Book appointment on behalf of family member
    book_payload = {
        "tenant_id": "city-hospital-01",
        "consumer_type": "hospital",
        "service_category": "general_checkup",
        "patient_name": "Tommy Doe Jr.",
        "user_email": user_email,
        "appointment_date": "2026-09-10",
        "time_slot": "10:00 AM",
        "family_member_id": child_id
    }
    res_book = client.post("/api/v1/plugin/appointments/book", json=book_payload)
    assert res_book.status_code == 200, res_book.text
    appt_data = res_book.json().get("appointment")
    assert appt_data["patient_name"] == "Tommy Doe Jr."
    assert appt_data["appointment_id"] is not None

    # 8. Join queue on behalf of family member
    join_payload = {
        "tenant_id": "city-hospital-01",
        "consumer_type": "hospital",
        "service_category": "general_checkup",
        "name": "Jane Doe",
        "urgency": "normal",
        "user_email": user_email,
        "age": 55,
        "gender": "female",
        "family_member_id": mother_id
    }
    res_join = client.post("/api/v1/plugin/join", json=join_payload)
    assert res_join.status_code == 200, res_join.text
    ticket_data = res_join.json().get("ticket")
    assert ticket_data["name"] == "Jane Doe"

    # 9. Delete family member
    res_del = client.delete(f"/api/v1/family-members/{mother_id}", headers={"X-User-Email": user_email})
    assert res_del.status_code == 200

    # Verify list only contains child now
    res_list_after = client.get("/api/v1/family-members", headers={"X-User-Email": user_email})
    members_after = res_list_after.json().get("members", [])
    assert len(members_after) == 1
    assert members_after[0]["id"] == child_id

    print("ALL FAMILY PROFILE & BOOKING/QUEUE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_family_profiles_full_flow()
