"""
SynRide Test Suite: Authentication, Security, and Sensitive Data Protection
Tests Registration, Institutional Domain Enforcement, OTP verification, and JWT Guards.
"""
import pytest
from app.core.security import (
    validate_institutional_email, hash_password, verify_password,
    generate_secure_otp, hash_otp, verify_otp_hash
)

def test_institutional_email_validation():
    # Students must use @vitstudent.ac.in
    assert validate_institutional_email("student.test@vitstudent.ac.in", "STUDENT") is True
    assert validate_institutional_email("student.test@gmail.com", "STUDENT") is False
    assert validate_institutional_email("student.test@vit.ac.in", "STUDENT") is False

    # Faculty must use @vit.ac.in
    assert validate_institutional_email("prof.sharma@vit.ac.in", "FACULTY") is True
    assert validate_institutional_email("prof.sharma@yahoo.com", "FACULTY") is False

def test_password_hashing():
    raw_pwd = "SecureStudentPass#2026"
    pwd_hash = hash_password(raw_pwd)
    assert pwd_hash != raw_pwd
    assert verify_password(raw_pwd, pwd_hash) is True
    assert verify_password("WrongPassword", pwd_hash) is False

def test_otp_generation_and_hashing():
    otp = generate_secure_otp()
    assert len(otp) == 6
    assert otp.isdigit()

    email = "test.verification@vitstudent.ac.in"
    otp_hash = hash_otp(otp, email)
    assert verify_otp_hash(otp, email, otp_hash) is True
    assert verify_otp_hash("000000", email, otp_hash) is False

def test_registration_flow_with_invalid_domain(client):
    res = client.post("/api/auth/register", json={
        "full_name": "Invalid Domain User",
        "email": "invalid.user@gmail.com",
        "password": "Password@123",
        "user_role": "STUDENT"
    })
    assert res.status_code == 400
    assert "institutional email" in res.json()["detail"].lower()

def test_registration_and_otp_workflow(client):
    email = "test.newstudent@vitstudent.ac.in"
    reg_res = client.post("/api/auth/register", json={
        "full_name": "New Student",
        "email": email,
        "password": "Password@123",
        "user_role": "STUDENT",
        "student_profile": {
            "registration_no": "26BCE9999",
            "programme": "B.Tech CSE",
            "study_year": 2
        }
    })
    assert reg_res.status_code == 200
    data = reg_res.json()
    assert "dev_otp" in data
    dev_otp = data["dev_otp"]

    # Test invalid OTP attempt
    bad_otp_res = client.post("/api/auth/verify-otp", json={
        "email": email,
        "otp": "999999"
    })
    assert bad_otp_res.status_code == 400

    # Test sensitive data protection (hashes never exposed)
    res_str = reg_res.text
    assert "password_hash" not in res_str
    assert "otp_hash" not in res_str

def test_unauthenticated_endpoints_return_401(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401

def test_admin_endpoints_guard(client, student_auth_headers):
    # A student attempting to access admin route should receive 403 Forbidden
    res = client.get("/api/admin/dashboard", headers=student_auth_headers)
    assert res.status_code == 403
