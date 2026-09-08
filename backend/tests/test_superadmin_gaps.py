"""
test_superadmin_gaps_runner.py
------------------------------
Direct async test runner for the 5 Super Admin gaps:
1. Edit Department
2. Edit Desk
3. Audit Log Retrieval & Verification
4. Bulk Desk Status Update
5. Bulk Employee CSV Import
"""

import sys
import os
import io
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi import HTTPException, UploadFile
from main import (
    update_hospital_department_endpoint,
    update_hospital_desk_endpoint,
    bulk_update_desk_status_endpoint,
    bulk_import_employees_endpoint,
    get_audit_logs_endpoint,
    DepartmentUpdateRequest,
    DeskUpdateRequest,
    BulkDeskStatusRequest,
    engine
)
from database import get_db_connection

class MockRequest:
    def __init__(self, headers=None):
        self.headers = {k.lower(): v for k, v in (headers or {}).items()}
        for k, v in (headers or {}).items():
            self.headers[k] = v

async def run_tests():
    print("==================================================")
    print("STARTING SUPER ADMIN GAPS VERIFICATION SUITE")
    print("==================================================")

    # 1. Resolve authentic hospital and superadmin
    with get_db_connection() as conn:
        hosp = conn.execute("SELECT hospital_code, name FROM hospitals LIMIT 1").fetchone()
        assert hosp is not None, "No hospital found in database."
        h_code = hosp["hospital_code"]

        admin_user = conn.execute("SELECT email FROM users WHERE role = 'superadmin' LIMIT 1").fetchone()
        assert admin_user is not None, "No superadmin found in database."
        admin_email = admin_user["email"]

    req_admin = MockRequest({"x-user-email": admin_email})
    test_dept_code = "gap_test_dept"
    alt_dept_code = "gap_test_alt_dept"
    desk_id = None

    try:
        # Pre-cleanup
        try:
            engine.delete_hospital_department(h_code, test_dept_code, requester_email=admin_email)
        except Exception:
            pass
        try:
            engine.delete_hospital_department(h_code, alt_dept_code, requester_email=admin_email)
        except Exception:
            pass

        # -------------------------------------------------------------
        # Test 1: Edit Department (Gap #1)
        # -------------------------------------------------------------
        print("\n[TEST 1] Department Create & Edit (Gap #1)...")
        engine.add_hospital_department(h_code, test_dept_code, "Initial Dept", "Initial Desc", requester_email=admin_email)
        
        dept_payload = DepartmentUpdateRequest(name="Renamed Dept", description="Updated Desc")
        res1 = await update_hospital_department_endpoint(h_code, test_dept_code, dept_payload, req_admin)
        assert res1["status"] == "success"
        assert res1["department"]["name"] == "Renamed Dept"
        assert res1["department"]["description"] == "Updated Desc"
        print("  [PASS] Department successfully updated via endpoint.")

        # -------------------------------------------------------------
        # Test 2: Edit Desk & Reassign Department (Gap #2)
        # -------------------------------------------------------------
        print("\n[TEST 2] Desk Create, Edit & Reassign Department (Gap #2)...")
        engine.add_hospital_department(h_code, alt_dept_code, "Alt Dept", "Alt Desc", requester_email=admin_email)
        desk = engine.add_hospital_desk(h_code, test_dept_code, "Desk Alpha", "AVAILABLE", requester_email=admin_email)
        desk_id = desk["id"]

        desk_payload = DeskUpdateRequest(desk_name="Desk Alpha Renamed", dept_code=alt_dept_code)
        res2 = await update_hospital_desk_endpoint(h_code, desk_id, desk_payload, req_admin)
        assert res2["status"] == "success"
        assert res2["desk"]["desk_name"] == "Desk Alpha Renamed"
        assert res2["desk"]["dept_code"] == alt_dept_code
        print("  [PASS] Desk name updated and reassigned to alternate department.")

        # -------------------------------------------------------------
        # Test 3: Bulk Update Desk Status by Department (Gap #5A)
        # -------------------------------------------------------------
        print("\n[TEST 3] Bulk Desk Status by Department (Gap #5A)...")
        desk2 = engine.add_hospital_desk(h_code, alt_dept_code, "Desk Beta", "AVAILABLE", requester_email=admin_email)
        
        bulk_payload = BulkDeskStatusRequest(dept_code=alt_dept_code, status="OFFLINE")
        res3 = await bulk_update_desk_status_endpoint(h_code, bulk_payload, req_admin)
        assert res3["status"] == "success"
        assert res3["result"]["status"] == "OFFLINE"
        assert res3["result"]["updated_count"] >= 2
        print(f"  [PASS] Successfully updated {res3['result']['updated_count']} desks in department '{alt_dept_code}' to OFFLINE.")

        # -------------------------------------------------------------
        # Test 4: Bulk Employee CSV Import (Gap #5B)
        # -------------------------------------------------------------
        print("\n[TEST 4] Bulk Employee CSV Import with Validation (Gap #5B)...")
        csv_bytes = (
            "name,email,role,department,employee_id,phone\n"
            "Dr. Unit One,unit_test_doc_1@hospital.com,doctor," + alt_dept_code + ",EMP-U1,1111111111\n"
            "Nurse Unit Two,unit_test_staff_2@hospital.com,staff," + alt_dept_code + ",EMP-U2,2222222222\n"
            "Bad Role User,bad_role@hospital.com,astronaut," + alt_dept_code + ",EMP-U3,3333333333\n"
        ).encode("utf-8")

        upload_file = UploadFile(filename="test_employees.csv", file=io.BytesIO(csv_bytes))
        res4 = await bulk_import_employees_endpoint(h_code, upload_file, req_admin)
        assert res4["status"] == "success"
        assert res4["created_count"] == 2
        assert res4["failed_count"] == 1
        assert "Invalid role" in res4["failed"][0]["reason"]
        print(f"  [PASS] CSV import processed: {res4['created_count']} created, {res4['failed_count']} flagged for invalid role.")

        # -------------------------------------------------------------
        # Test 5: Audit Log Retrieval & RBAC (Gap #3)
        # -------------------------------------------------------------
        print("\n[TEST 5] Audit Trail Queries and Super Admin Access Control (Gap #3)...")
        res5 = await get_audit_logs_endpoint(req_admin, hospital_code=h_code, limit=50)
        assert res5["status"] == "success"
        logs = res5["audit_logs"]
        assert len(logs) > 0
        actions = [l["action"] for l in logs]
        print(f"  [PASS] Audit records found: {len(logs)}. Recent actions: {actions[:6]}")
        assert any("UPDATE_DEPARTMENT" in a for a in actions), "Missing UPDATE_DEPARTMENT in audit logs"
        assert any("UPDATE_DESK" in a for a in actions), "Missing UPDATE_DESK in audit logs"
        assert any("BULK_UPDATE_DESK_STATUS" in a for a in actions), "Missing BULK_UPDATE_DESK_STATUS in audit logs"
        assert any("BULK_IMPORT_EMPLOYEES" in a for a in actions), "Missing BULK_IMPORT_EMPLOYEES in audit logs"

        # Check RBAC: non-superadmin should receive 403 HTTPException
        req_nonadmin = MockRequest({"x-user-email": "unit_test_doc_1@hospital.com"})
        try:
            await get_audit_logs_endpoint(req_nonadmin, hospital_code=h_code)
            assert False, "Non-superadmin should have been rejected with 403"
        except HTTPException as he:
            assert he.status_code == 403
            print("  [PASS] Non-superadmin correctly blocked with HTTP 403 Forbidden.")

    finally:
        # -------------------------------------------------------------
        # Thorough Cleanup: Leave database completely pristine
        # -------------------------------------------------------------
        print("\n[CLEANUP] Cleaning up temporary test records...")
        with get_db_connection() as conn:
            # Delete employees and users created during test
            conn.execute("DELETE FROM employees WHERE employee_code IN ('EMP-U1', 'EMP-U2')")
            conn.execute("DELETE FROM users WHERE email IN ('unit_test_doc_1@hospital.com', 'unit_test_staff_2@hospital.com')")
            # Delete desks created during test
            conn.execute("DELETE FROM desks WHERE desk_name LIKE 'Desk Alpha%' OR desk_name LIKE 'Desk Beta%'")
            # Delete departments created during test
            conn.execute("DELETE FROM departments WHERE dept_code IN (%s, %s)", (test_dept_code, alt_dept_code))
            # Delete audit logs generated for these test entities
            desk_id_str = str(desk_id) if desk_id else "none"
            conn.execute("DELETE FROM audit_logs WHERE entity_id IN (%s, %s, %s, %s, %s)", (
                test_dept_code,
                alt_dept_code,
                desk_id_str,
                f"{alt_dept_code}:all",
                f"{h_code}:bulk"
            ))
        print("  [PASS] Cleanup complete. No dummy test data remaining in database.")

    print("\n==================================================")
    print("ALL 5 GAPS FUNCTIONALLY VERIFIED & VALIDATED!")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(run_tests())
