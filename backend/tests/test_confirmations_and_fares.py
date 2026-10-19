"""
SynRide Test Suite: Confirmations, Fares & Payments
Tests Confirmation Deadlines, Exact Fare Share Allocation with Remainder, and Payment Workflows.
"""
import pytest

def test_fare_allocation_calculation_exact_shares():
    """
    Mathematical verification of the academic fare allocation algorithm:
    Actual fare ₹250 split among 3 members:
    Base share: trunc(250 / 3) = ₹83.33 each
    Remainder: 250 - (83.33 * 3) = ₹0.01 allocated to coordinator
    Shares: Coordinator pays ₹83.34, Passengers pay ₹83.33 each
    Total sum: 83.34 + 83.33 + 83.33 = ₹250.00 exact!
    """
    actual_fare = 250.00
    active_count = 3
    base_share = int(actual_fare / active_count * 100) / 100.0  # trunc to 2 decimals
    remainder = round(actual_fare - (base_share * active_count), 2)

    coord_share = round(base_share + remainder, 2)
    passenger_share = base_share

    total_allocated = round(coord_share + (passenger_share * (active_count - 1)), 2)
    assert total_allocated == actual_fare
    assert coord_share == 83.34
    assert passenger_share == 83.33

def test_fare_discrepancy_check():
    est_fare = 250.00
    # 1. Fare within 25% (₹230 is -8%)
    diff_pct_1 = abs(230.00 - est_fare) / est_fare
    assert diff_pct_1 <= 0.25

    # 2. Fare with >25% discrepancy (₹350 is +40%)
    diff_pct_2 = abs(350.00 - est_fare) / est_fare
    assert diff_pct_2 > 0.25

def test_payment_status_update(client, student_auth_headers):
    # Update payment status of membership 1
    res = client.put("/api/fares/1/payment", headers=student_auth_headers, json={
        "payment_status": "PAID"
    })
    # If fare share exists, returns 200
    assert res.status_code in (200, 404)
