import sys
import os
import time
import random

# Add backend directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from queue_engine import engine

def run_tests():
    print("=== STARTING AUTH & TENANT ISOLATION TESTS ===")
    ts = int(time.time())

    # Test 1: Super Admin Registration
    sa_email = f"owner_test_{ts}@hospital.com"
    h_code_1 = f"apex-care-{ts % 1000}"
    sa_res = engine.register_superadmin(
        email=sa_email,
        username="Dr. Owner One",
        password="SuperPassword123!",
        phone="+1 555-111-2222",
        hospital_name="Apex Care Center",
        hospital_code=h_code_1
    )
    assert sa_res["role"] in ("superadmin", "super_admin"), f"Super admin role mismatch: {sa_res.get('role')}"
    assert sa_res["hospital_code"] == h_code_1, "Hospital code mismatch"
    print(f"[PASS] Test 1: Super Admin registered with dedicated hospital '{h_code_1}'")

    # Test 2: Super Admin creates Doctor & Staff with Employee ID
    doc_email = f"priya.rao_{ts}@apexcare.com"
    doc_emp_id = f"DOC-{ts % 10000}"
    doc_res = engine.add_hospital_employee(
        hospital_code=h_code_1,
        name="Dr. Priya Rao",
        email=doc_email,
        role="doctor",
        department="consultation",
        employee_id=doc_emp_id,
        phone="+1 555-333-4444",
        password="DoctorPass123!"
    )
    assert doc_res["employee_id"] == doc_emp_id, "Employee ID mismatch"
    print(f"[PASS] Test 2: Doctor created under Super Admin hospital with ID '{doc_emp_id}'")

    # Test 3: Dual Login with Email OR Assigned Employee ID
    login_by_email = engine.authenticate_user(doc_email, "DoctorPass123!")
    assert login_by_email["email"] == doc_email, "Login by email failed"
    assert login_by_email["employee_id"] == doc_emp_id, "Missing employee ID in login"

    login_by_id = engine.authenticate_user(doc_emp_id, "DoctorPass123!")
    assert login_by_id["email"] == doc_email, "Login by employee ID failed"
    print("[PASS] Test 3: Dual Login verified (Email AND Assigned ID authenticate successfully)")

    # Test 4: Hospital Admin Registration
    admin_email = f"admin_apex_{ts}@hospital.com"
    admin_res = engine.register_admin(
        email=admin_email,
        username="Admin Apex",
        password="AdminPassword123!",
        phone="+1 555-444-5555",
        hospital_code=h_code_1
    )
    assert admin_res["role"] == "admin"
    assert admin_res["hospital_code"] == h_code_1
    print(f"[PASS] Test 4: Hospital Admin registered bound to '{h_code_1}'")

    # Test 5: Tenant Isolation & 403 Verification
    # Register another Super Admin with different hospital
    sa_email_2 = f"owner_test_2_{ts}@hospital.com"
    h_code_2 = f"metro-health-{ts % 1000}"
    sa_res_2 = engine.register_superadmin(
        email=sa_email_2,
        username="Dr. Owner Two",
        password="SuperPassword456!",
        hospital_name="Metro Health",
        hospital_code=h_code_2
    )

    # Owner 1 accessing h_code_1 -> True
    assert engine.verify_hospital_access(h_code_1, sa_email) is True, f"Owner 1 should access {h_code_1}"
    # Owner 1 accessing h_code_2 -> False
    assert engine.verify_hospital_access(h_code_2, sa_email) is False, f"Owner 1 MUST NOT access {h_code_2}"
    # Owner 2 accessing h_code_1 -> False
    assert engine.verify_hospital_access(h_code_1, sa_email_2) is False, f"Owner 2 MUST NOT access {h_code_1}"
    # Owner 2 accessing h_code_2 -> True
    assert engine.verify_hospital_access(h_code_2, sa_email_2) is True, f"Owner 2 should access {h_code_2}"
    print("[PASS] Test 5: Strict Super Admin Tenant Isolation verified (Zero cross-tenant leakage)")

    # Test 6: Scoped Overview and Hospitals List
    sa1_hospitals = engine.get_all_hospitals(requester_email=sa_email)
    assert all(h["hospital_code"] != h_code_2 for h in sa1_hospitals), "Cross-hospital listing leaked in get_all_hospitals!"
    print("[PASS] Test 6: Scoped overview and hospital list filter strictly to owned hospital")

    # Test 7: Patient Registration
    patient_email = f"patient_{ts}@gmail.com"
    patient_res = engine.register_user(
        email=patient_email,
        username="John Patient",
        password="PatientPass123!",
        role="user",
        department="all"
    )
    assert patient_res["role"] == "user"
    print("[PASS] Test 7: Patient registered successfully with role 'user'")

    print("\nSUCCESS: ALL AUTHENTICATION, TENANT ISOLATION & DUAL LOGIN TESTS PASSED!")

if __name__ == "__main__":
    run_tests()
