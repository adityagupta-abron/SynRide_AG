"""
SynRide Test Suite: Live Oracle Database Integration
Executes real SQL and PL/SQL against Oracle AI Database 26ai Free in FREEPDB1.
"""
import pytest
from app.db.connection import get_db_connection, get_db_transaction, rows_to_dicts, row_to_dict

def test_oracle_live_connectivity():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    sys_context('USERENV', 'CURRENT_SCHEMA') AS current_schema,
                    sys_context('USERENV', 'SERVICE_NAME') AS service_name,
                    sys_context('USERENV', 'DB_NAME') AS db_name
                FROM DUAL
            """)
            row = cur.fetchone()
            assert row[0] == "SYNRIDE"
            assert "FREEPDB1" in row[1].upper()

def test_oracle_views_and_specialization():
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Query V_USER_PROFILES
            cur.execute("SELECT user_id, full_name, user_role, profile_type FROM V_USER_PROFILES")
            profiles = rows_to_dicts(cur)
            assert len(profiles) >= 4  # Users 1, 2, 3, 21

            # Query V_ACTIVE_RIDE_GROUPS
            cur.execute("SELECT group_id, coordinator_name, pickup_location, destination FROM V_ACTIVE_RIDE_GROUPS")
            groups = rows_to_dicts(cur)
            assert len(groups) >= 1

            # Query V_RIDE_GROUP_MEMBERS_DETAIL
            cur.execute("SELECT membership_id, full_name, member_role, confirmation_status FROM V_RIDE_GROUP_MEMBERS_DETAIL WHERE group_id = 1")
            members = rows_to_dicts(cur)
            assert len(members) == 3

def test_oracle_stored_procedure_join_capacity_enforcement():
    """
    Verifies that JOIN_RIDE_GROUP correctly rejects attempts to exceed
    the 3-passenger maximum capacity limit on Group 1 (which already has 3 members).
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            out_mem = cur.var(int)
            # Attempting to join User 21 into Group 1 (which has 3 members) must raise ORA-20004
            try:
                cur.callproc("JOIN_RIDE_GROUP", [1, 21, out_mem])
                pytest.fail("Expected capacity limit exception was not raised")
            except Exception as e:
                err_str = str(e)
                assert "20004" in err_str or "maximum capacity" in err_str.lower()

def test_oracle_duplicate_active_membership_prevention():
    """
    Verifies that joining a user who already has an active membership
    in the same group is rejected by JOIN_RIDE_GROUP / UQ_ACTIVE_GROUP_MEMBER.
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            out_mem = cur.var(int)
            # User 1 is already coordinator of Group 1
            try:
                cur.callproc("JOIN_RIDE_GROUP", [1, 1, out_mem])
                pytest.fail("Expected duplicate membership exception was not raised")
            except Exception as e:
                err_str = str(e)
                assert "20003" in err_str or "already has an active membership" in err_str.lower()

def test_email_preference_and_notifications(client, student_auth_headers):
    # 1. Update email preference to False
    res_off = client.put("/api/notifications/preferences", headers=student_auth_headers, json={
        "email_enabled": False
    })
    assert res_off.status_code == 200

    # 2. Verify preference status
    res_get = client.get("/api/notifications/preferences", headers=student_auth_headers)
    assert res_get.status_code == 200
    assert res_get.json()["email_enabled"] is False

    # 3. Restore preference to True
    res_on = client.put("/api/notifications/preferences", headers=student_auth_headers, json={
        "email_enabled": True
    })
    assert res_on.status_code == 200

