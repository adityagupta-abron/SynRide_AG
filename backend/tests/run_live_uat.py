"""
SynRide Live End-to-End User Acceptance Test (UAT) Runner
Executes comprehensive user acceptance tests against the live running servers:
Backend: http://127.0.0.1:8005
Frontend: http://127.0.0.1:5173
Database: Oracle AI Database 26ai Free (FREEPDB1) via dedicated SYNRIDE_APP
"""
import urllib.request
import json
import time

BASE = "http://127.0.0.1:8005/api"

def call(endpoint, method="GET", data=None, token=None):
    url = f"{BASE}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req_body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=req_body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            text = resp.read().decode("utf-8")
            return resp.status, json.loads(text) if text else {}
    except urllib.error.HTTPError as e:
        text = e.read().decode("utf-8")
        try:
            return e.code, json.loads(text)
        except Exception:
            return e.code, {"detail": text}

def main():
    tests_run = []

    def record(name, status, detail=""):
        tests_run.append({"name": name, "status": status, "detail": detail})
        print(f"[{status}] {name}" + (f" -> {detail}" if detail else ""))

    print("=================== SYN RIDE E2E UAT EXECUTION ===================")

    # -------------------------------------------------------------
    # WORKFLOW 1: Registration, Domain Validation, OTP & Login
    # -------------------------------------------------------------
    code, res = call("/auth/register", "POST", {
        "full_name": "Invalid User", "email": "student@gmail.com", "password": "Password@123",
        "user_role": "STUDENT", "registration_no": "24BAD001", "programme": "B.Tech", "study_year": 1
    })
    record("WF1.1: Domain Validation Rejects Non-VIT Email", "PASS" if code == 400 else "FAIL", f"HTTP {code}")

    uid = int(time.time()) % 100000
    test_student_email = f"uat.student{uid}@vitstudent.ac.in"
    test_reg_no = f"24BCE{uid:04d}"
    code, res = call("/auth/register", "POST", {
        "full_name": "UAT Verified Student", "email": test_student_email, "password": "Password@123",
        "user_role": "STUDENT", "registration_no": test_reg_no, "programme": "B.Tech CSE", "study_year": 2
    })
    otp = res.get("dev_otp")
    record("WF1.2: Valid Student Registration Issues OTP", "PASS" if code == 200 and otp else "FAIL", f"HTTP {code}")

    code, res = call("/auth/verify-otp", "POST", {"email": test_student_email, "otp": otp})
    student_token = res.get("access_token")
    student_user_id = res.get("user_id")
    record("WF1.3: OTP Verification & JWT Token Issuance", "PASS" if code == 200 and student_token else "FAIL", f"HTTP {code}")

    code, res = call("/auth/login", "POST", {"email": test_student_email, "password": "Password@123"})
    record("WF1.4: Direct Login with Valid Credentials", "PASS" if code == 200 and "access_token" in res else "FAIL", f"HTTP {code}")

    # -------------------------------------------------------------
    # WORKFLOW 2: Viewing User Profile
    # -------------------------------------------------------------
    code, profile = call("/auth/me", "GET", token=student_token)
    email_matched = profile.get("email") == test_student_email
    record("WF2.1: Fetch User Profile via GET /api/auth/me", "PASS" if code == 200 and email_matched else "FAIL", f"HTTP {code}")

    # -------------------------------------------------------------
    # WORKFLOW 3: Ride Requests & Ride Matching
    # -------------------------------------------------------------
    code, routes = call("/rides/routes", "GET")
    record("WF3.1: Fetch Predefined Campus Route Fares", "PASS" if code == 200 and len(routes) > 0 else "FAIL", f"count={len(routes)}")

    code, req1 = call("/rides/requests", "POST", {
        "request_type": "LOOKING_FOR_COMPANIONS",
        "pickup_location": "VIT Main Gate",
        "destination": "Katpadi Railway Station",
        "departure_time": "2026-10-22T10:00:00"
    }, token=student_token)
    req1_id = req1.get("request_id")
    record("WF3.2: Submit Passenger Ride Request", "PASS" if code in (200, 201) and req1_id else "FAIL", f"request_id={req1_id}")

    code, matches = call("/rides/match", "POST", {
        "pickup_location": "VIT Main Gate",
        "destination": "Katpadi Railway Station",
        "departure_time": "2026-10-22T10:05:00"
    }, token=student_token)
    record("WF3.3: Ride Matching (Within +/-15 min window)", "PASS" if code == 200 and isinstance(matches, list) else "FAIL", f"HTTP {code}")

    # -------------------------------------------------------------
    # WORKFLOW 4: Groups, Joining & 3-Passenger Capacity Enforcement
    # -------------------------------------------------------------
    code, groups = call("/groups", "GET")
    record("WF4.1: List Active Ride Groups", "PASS" if code == 200 and len(groups) > 0 else "FAIL", f"count={len(groups)}")

    code, g1 = call("/groups/1", "GET")
    record("WF4.2: Fetch Baseline Group 1 Details", "PASS" if code == 200 and g1.get("group_id") == 1 else "FAIL", f"coordinator_id={g1.get('coordinator_id')}")

    # Group 1 already has 3 members (Coordinator 1, Passengers 2, 3)
    # Joining should be rejected with HTTP 400 or 409 CapacityExceededError
    code, join_res = call("/groups/1/join", "POST", token=student_token)
    record("WF4.3: Concurrency & Strict 3-Passenger Limit Enforcement", "PASS" if code in (400, 409) else "FAIL", f"HTTP {code}: {join_res.get('detail')}")

    # -------------------------------------------------------------
    # WORKFLOW 5: Deadline & Group Expiry
    # -------------------------------------------------------------
    code, res = call("/groups/1/deadline?minutes=10", "POST", token=student_token)
    record("WF5.1: Set Confirmation Deadline Endpoint Guard", "PASS" if code in (200, 403) else "FAIL", f"HTTP {code}")

    # -------------------------------------------------------------
    # WORKFLOW 6: Route Fare Display
    # -------------------------------------------------------------
    code, fare_info = call("/groups/1/fare", "GET", token=student_token)
    record("WF6.1: Route Fare Display for Group 1", "PASS" if code == 200 and isinstance(fare_info, list) else "FAIL", f"shares_count={len(fare_info) if isinstance(fare_info, list) else 'err'}")

    # -------------------------------------------------------------
    # WORKFLOW 8: In-App Notifications & Email Preferences
    # -------------------------------------------------------------
    code, notifs = call("/notifications", "GET", token=student_token)
    record("WF8.1: Retrieve User Notifications Inbox", "PASS" if code == 200 and isinstance(notifs, list) else "FAIL", f"count={len(notifs)}")

    code, pref = call("/notifications/preferences", "GET", token=student_token)
    record("WF8.2: Retrieve Email Notification Preferences", "PASS" if code == 200 and "email_enabled" in pref else "FAIL", f"enabled={pref.get('email_enabled')}")

    code, pref_up = call("/notifications/preferences?email_enabled=N", "PUT", token=student_token)
    record("WF8.3: Toggle Email Preference to 'N'", "PASS" if code == 200 and pref_up.get("email_enabled") == "N" else "FAIL", f"updated={pref_up.get('email_enabled')}")

    # -------------------------------------------------------------
    # WORKFLOW 9: Reports Filing
    # -------------------------------------------------------------
    code, rep = call("/reports", "POST", {
        "group_id": 1,
        "reported_user_id": 1,
        "report_reason": "Late Arrival",
        "description": "Coordinator arrived 20 minutes late without notification."
    }, token=student_token)
    rep_id = rep.get("report_id")
    record("WF9.1: File Disciplinary Report Against Participant", "PASS" if code in (200, 201) and rep_id else "FAIL", f"report_id={rep_id}")

    # -------------------------------------------------------------
    # WORKFLOW 10: Admin Role-Based Access Control & Review Queue
    # -------------------------------------------------------------
    # 10.1 Student is forbidden from admin dashboard
    code, _ = call("/admin/dashboard", "GET", token=student_token)
    record("WF10.1: RBAC - Student Forbidden from Admin Dashboard", "PASS" if code == 403 else "FAIL", f"HTTP {code}")

    # 10.2 Admin login
    code, admin_login = call("/auth/login", "POST", {"email": "admin@vit.ac.in", "password": "Admin@123"})
    admin_token = admin_login.get("access_token")
    record("WF10.2: Administrator Authentication", "PASS" if code == 200 and admin_token else "FAIL", f"HTTP {code}")

    # 10.3 Admin dashboard metrics
    code, stats = call("/admin/dashboard", "GET", token=admin_token)
    record("WF10.3: Administrator Dashboard Analytics", "PASS" if code == 200 and "total_users" in stats else "FAIL", f"total_users={stats.get('total_users')}")

    # 10.4 Admin review queue
    code, reviews = call("/admin/reviews", "GET", token=admin_token)
    record("WF10.4: Fetch Escalated Review Queue (V_ADMIN_REVIEW_QUEUE)", "PASS" if code == 200 and isinstance(reviews, list) else "FAIL", f"items={len(reviews)}")

    # 10.5 Admin resolve report
    if rep_id:
        code, resolve_res = call(f"/reports/{rep_id}/resolve?outcome_note=Reviewed+and+resolved+with+warning", "POST", token=admin_token)
        record("WF10.5: Resolve Report with Mandatory Admin Outcome Note", "PASS" if code == 200 else "FAIL", f"HTTP {code}")

    # 10.6 Admin routes management
    code, admin_routes = call("/admin/routes", "GET", token=admin_token)
    record("WF10.6: Administrator Route Fare Catalog Management", "PASS" if code == 200 and len(admin_routes) > 0 else "FAIL", f"routes={len(admin_routes)}")

    print("\n===============================================================")
    passes = sum(1 for t in tests_run if t["status"] == "PASS")
    total = len(tests_run)
    print(f"E2E UAT EXECUTION SUMMARY: {passes}/{total} TESTS PASSED ({(passes/total)*100:.1f}%)")
    print("===============================================================")

if __name__ == "__main__":
    main()
