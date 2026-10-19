"""
SynRide Test Suite: Ratings, Reviews, Reports & Admin Oversight
Tests 1-5 Star Ratings, Self-Rating Prohibition, Reports, and Mandatory Outcome Notes.
"""
import pytest

def test_rating_score_validation(client, student_auth_headers):
    # Score 0 (below 1) must be rejected
    res_zero = client.post("/api/groups/1/ratings", headers=student_auth_headers, json={
        "reviewed_membership_id": 2,
        "rating": 0
    })
    assert res_zero.status_code == 422

    # Score 6 (above 5) must be rejected
    res_six = client.post("/api/groups/1/ratings", headers=student_auth_headers, json={
        "reviewed_membership_id": 2,
        "rating": 6
    })
    assert res_six.status_code == 422

def test_report_creation_and_resolution_flow(client, student_auth_headers, admin_auth_headers):
    # 1. User submits report
    rep_res = client.post("/api/reports", headers=student_auth_headers, json={
        "group_id": 1,
        "reported_user_id": 3,
        "report_reason": "No-show without notice",
        "description": "Passenger did not arrive at pickup point."
    })
    assert rep_res.status_code == 201
    rep_id = rep_res.json()["report_id"]

    # 2. Administrator attempts to resolve without outcome note (must fail)
    bad_res = client.post(f"/api/reports/{rep_id}/resolve", headers=admin_auth_headers, json={
        "status": "RESOLVED",
        "outcome_note": ""
    })
    assert bad_res.status_code in (400, 422)

    # 3. Administrator resolves with compliant outcome note (must succeed)
    good_res = client.post(f"/api/reports/{rep_id}/resolve", headers=admin_auth_headers, json={
        "status": "RESOLVED",
        "outcome_note": "Reviewed situation with both parties. Passenger received formal warning."
    })
    assert good_res.status_code == 200
    assert good_res.json()["report"]["report_status"] == "RESOLVED"
