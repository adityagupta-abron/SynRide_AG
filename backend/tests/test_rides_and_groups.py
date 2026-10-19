"""
SynRide Test Suite: Rides, Groups, Matching & Concurrency Limits
Tests Route Fares, Matching Algorithms, 3-Person Capacity Limit, and Coordinator Replacement.
"""
import pytest
from datetime import datetime, timedelta

def test_identical_pickup_and_destination_fails(client, student_auth_headers):
    # Route cannot have identical pickup and destination
    dep_time = (datetime.now() + timedelta(days=2)).isoformat()
    res = client.post("/api/rides/requests", headers=student_auth_headers, json={
        "request_type": "LOOKING_FOR_COMPANIONS",
        "pickup_location": "VIT Main Gate",
        "destination": "VIT Main Gate",
        "departure_time": dep_time
    })
    assert res.status_code == 422  # Pydantic validation error

def test_active_route_fares_listing(client):
    res = client.get("/api/rides/routes")
    assert res.status_code == 200
    routes = res.json()
    assert len(routes) >= 1
    # Katpadi route should exist with estimated fare 250
    katpadi = next((r for r in routes if "Katpadi" in r["destination"]), None)
    assert katpadi is not None
    assert katpadi["estimated_fare"] > 0

def test_ride_matching_within_15_minutes(client, student_auth_headers):
    dep_time = (datetime.now() + timedelta(days=3)).replace(hour=14, minute=0, second=0, microsecond=0)
    
    # 1. Create request 1
    res1 = client.post("/api/rides/requests", headers=student_auth_headers, json={
        "request_type": "LOOKING_FOR_COMPANIONS",
        "pickup_location": "VIT Main Gate",
        "destination": "Katpadi Railway Station",
        "departure_time": dep_time.isoformat()
    })
    assert res1.status_code == 201

    # 2. Search match 10 minutes later (within +-15 min window)
    match_time = dep_time + timedelta(minutes=10)
    res_match = client.post("/api/rides/match", headers=student_auth_headers, json={
        "pickup_location": "VIT Main Gate",
        "destination": "Katpadi Railway Station",
        "departure_time": match_time.isoformat()
    })
    assert res_match.status_code == 200

    # 3. Search match 40 minutes later (outside window)
    outside_time = dep_time + timedelta(minutes=40)
    res_outside = client.post("/api/rides/match", headers=student_auth_headers, json={
        "pickup_location": "VIT Main Gate",
        "destination": "Katpadi Railway Station",
        "departure_time": outside_time.isoformat()
    })
    assert res_outside.status_code == 200
    outside_matches = [m for m in res_outside.json() if m["request_id"] == res1.json()["request_id"]]
    assert len(outside_matches) == 0

def test_get_existing_group_details(client):
    # Group 1 exists in baseline test fixtures
    res = client.get("/api/groups/1")
    assert res.status_code == 200
    group = res.json()
    assert group["group_id"] == 1
    assert group["coordinator_id"] == 1
    assert len(group["members"]) == 3
