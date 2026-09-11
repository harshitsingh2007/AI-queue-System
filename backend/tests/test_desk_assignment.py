import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import get_db_connection
from main import (
    add_hospital_desk_endpoint,
    assign_hospital_desk_endpoint,
    update_hospital_desk_endpoint,
    delete_hospital_desk_endpoint,
    DeskCreateRequest,
    DeskUpdateRequest,
    DeskAssignRequest,
    engine,
)

class MockRequest:
    def __init__(self, headers=None):
        self.headers = {k.lower(): v for k, v in (headers or {}).items()}

async def test_desk_assignment():
    print("Testing Desk Assignment Endpoints & Engine...")
    with get_db_connection() as conn:
        row = conn.execute("""
            SELECT h.hospital_code, e.id as emp_id, e.name as emp_name, u.role, d.dept_code
            FROM employees e
            JOIN hospitals h ON h.id = e.hospital_id
            JOIN users u ON u.id = e.user_id
            LEFT JOIN departments d ON d.hospital_id = h.id
            LIMIT 1
        """).fetchone()
        assert row is not None, "Need at least one employee in database"
        h_code = row["hospital_code"]
        emp_id = row["emp_id"]
        dept_code = row["dept_code"] or "consultation"

    req = MockRequest()

    # 1. Test Create Desk with assigned employee
    create_payload = DeskCreateRequest(
        dept_code=dept_code,
        desk_name="Unit Test Desk 101",
        status="AVAILABLE",
        assigned_employee_id=emp_id,
    )
    res_create = await add_hospital_desk_endpoint(h_code, create_payload, req)
    assert res_create["status"] == "success"
    desk_id = res_create["desk"]["id"]
    assert res_create["desk"]["assigned_employee_id"] == emp_id
    assert res_create["desk"]["assigned_employee_name"] == row["emp_name"]
    print("[PASS] Created desk with assigned employee:", res_create["desk"]["desk_name"], "->", res_create["desk"]["assigned_employee_name"])

    # 2. Test Get Desks includes assignment fields
    desks_list = engine.get_hospital_desks(h_code)
    desk_item = next(d for d in desks_list if d["id"] == desk_id)
    assert desk_item["assigned_employee_id"] == emp_id
    assert desk_item["assigned_employee_name"] == row["emp_name"]
    assert desk_item["assigned_employee_role"] == row["role"]
    print("[PASS] get_hospital_desks returned assigned employee info correctly")

    # 3. Test Unassign Desk via assign endpoint
    unassign_payload = DeskAssignRequest(assigned_employee_id=None)
    res_unassign = await assign_hospital_desk_endpoint(h_code, desk_id, unassign_payload, req)
    assert res_unassign["status"] == "success"
    assert res_unassign["desk"]["assigned_employee_id"] is None
    assert res_unassign["desk"]["assigned_employee_name"] is None
    print("[PASS] Unassigned desk successfully")

    # 4. Test Reassign Desk via assign endpoint
    reassign_payload = DeskAssignRequest(assigned_employee_id=emp_id)
    res_reassign = await assign_hospital_desk_endpoint(h_code, desk_id, reassign_payload, req)
    assert res_reassign["status"] == "success"
    assert res_reassign["desk"]["assigned_employee_id"] == emp_id
    assert res_reassign["desk"]["assigned_employee_name"] == row["emp_name"]
    print("[PASS] Reassigned desk to employee successfully")

    # 5. Cleanup
    del_res = await delete_hospital_desk_endpoint(h_code, desk_id, req)
    assert del_res["status"] == "success"
    print("[PASS] Cleaned up test desk successfully")
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test_desk_assignment())
