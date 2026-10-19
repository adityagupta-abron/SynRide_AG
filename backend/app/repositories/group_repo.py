"""
SynRide Groups & Memberships Repository
Handles RIDE_GROUP, RIDE_GROUP_MEMBER, stored procedure execution for JOIN_RIDE_GROUP,
coordinator replacement, and group lifecycle state transitions.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import oracledb
from app.db.connection import get_db_connection, get_db_transaction, row_to_dict, rows_to_dicts, handle_oracle_error
from app.core.exceptions import EntityNotFoundError, SynRideException, CapacityExceededError

class GroupRepository:

    @staticmethod
    def create_group(
        request_id: int,
        coordinator_id: int,
        departure_time: datetime,
        estimated_fare: Optional[float] = None
    ) -> int:
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                # 1. Create RIDE_GROUP
                grp_id_var = cur.var(int)
                cur.execute("""
                    INSERT INTO RIDE_GROUP (
                        request_id, coordinator_id, departure_time,
                        group_status, estimated_fare, created_at
                    )
                    VALUES (
                        :req_id, :coord_id, :dep_time,
                        'PENDING', :est_fare, SYSTIMESTAMP
                    )
                    RETURNING group_id INTO :grp_id_var
                """, {
                    "req_id": request_id,
                    "coord_id": coordinator_id,
                    "dep_time": departure_time,
                    "est_fare": estimated_fare,
                    "grp_id_var": grp_id_var
                })
                group_id = grp_id_var.getvalue()[0]

                # 2. Add coordinator as first group member with role COORDINATOR
                mem_id_var = cur.var(int)
                cur.execute("""
                    INSERT INTO RIDE_GROUP_MEMBER (
                        group_id, user_id, member_role, membership_status, joined_at
                    )
                    VALUES (
                        :grp_id, :uid, 'COORDINATOR', 'PENDING', SYSTIMESTAMP
                    )
                    RETURNING membership_id INTO :mem_id_var
                """, {
                    "grp_id": group_id,
                    "uid": coordinator_id,
                    "mem_id_var": mem_id_var
                })
                coord_mem_id = mem_id_var.getvalue()[0]

                # 3. Initialize coordinator's pending confirmation record
                cur.execute("""
                    INSERT INTO RIDE_CONFIRMATION (membership_id, confirmation_status, created_at)
                    VALUES (:mem_id, 'PENDING', SYSTIMESTAMP)
                """, {"mem_id": coord_mem_id})

                # 4. Update the original request status to MATCHED
                cur.execute("""
                    UPDATE RIDE_REQUEST
                    SET request_status = 'MATCHED'
                    WHERE request_id = :req_id
                """, {"req_id": request_id})

                return group_id

    @staticmethod
    def get_group_by_id(group_id: int) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT *
                    FROM V_ACTIVE_RIDE_GROUPS
                    WHERE group_id = :grp_id
                """, {"grp_id": group_id})
                return row_to_dict(cur)

    @staticmethod
    def list_active_groups() -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT *
                    FROM V_ACTIVE_RIDE_GROUPS
                    WHERE group_status IN ('PENDING', 'CONFIRMED')
                    ORDER BY departure_time ASC
                """)
                return rows_to_dicts(cur)

    @staticmethod
    def list_user_groups(user_id: int) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT g.*
                    FROM V_ACTIVE_RIDE_GROUPS g
                    JOIN RIDE_GROUP_MEMBER m ON g.group_id = m.group_id
                    WHERE m.user_id = :user_id
                      AND m.membership_status IN ('PENDING', 'CONFIRMED')
                    ORDER BY g.departure_time DESC
                """, {"user_id": user_id})
                return rows_to_dicts(cur)

    @staticmethod
    def list_group_members(group_id: int) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT *
                    FROM V_RIDE_GROUP_MEMBERS_DETAIL
                    WHERE group_id = :grp_id
                    ORDER BY joined_at ASC
                """, {"grp_id": group_id})
                return rows_to_dicts(cur)

    @staticmethod
    def get_user_active_membership(group_id: int, user_id: int) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT *
                    FROM V_RIDE_GROUP_MEMBERS_DETAIL
                    WHERE group_id = :grp_id
                      AND user_id = :user_id
                      AND membership_status IN ('PENDING', 'CONFIRMED')
                """, {"grp_id": group_id, "user_id": user_id})
                return row_to_dict(cur)

    @staticmethod
    def join_group(group_id: int, user_id: int) -> int:
        """Calls the Oracle JOIN_RIDE_GROUP stored procedure."""
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                out_mem_id = cur.var(int)
                cur.callproc("JOIN_RIDE_GROUP", [group_id, user_id, out_mem_id])
                return out_mem_id.getvalue()

    @staticmethod
    def replace_coordinator(group_id: int, volunteer_user_id: Optional[int] = None) -> int:
        """Calls the Oracle REPLACE_COORDINATOR stored procedure."""
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                out_coord_id = cur.var(int)
                cur.callproc("REPLACE_COORDINATOR", [group_id, volunteer_user_id, out_coord_id])
                return out_coord_id.getvalue()

    @staticmethod
    def cancel_membership(
        membership_id: int,
        group_id: int,
        cancelled_by_user_id: int,
        reason: str,
        is_coordinator: bool,
        departure_time: datetime
    ) -> Dict[str, Any]:
        """
        Cancels a member's participation.
        Enforces 60-minute cancellation rule:
        Cancellation within 60 minutes flags admin_review_required = 'Y'.
        """
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                # 1. Update membership status to CANCELLED
                cur.execute("""
                    UPDATE RIDE_GROUP_MEMBER
                    SET membership_status = 'CANCELLED'
                    WHERE membership_id = :mem_id
                """, {"mem_id": membership_id})

                # 2. Update confirmation status if pending
                cur.execute("""
                    UPDATE RIDE_CONFIRMATION
                    SET confirmation_status = 'DECLINED'
                    WHERE membership_id = :mem_id
                      AND confirmation_status = 'PENDING'
                """, {"mem_id": membership_id})

                # 3. Check 60-minute window
                # If less than 60 minutes before departure, require admin review flag
                now = datetime.now()
                # Ensure offset-naive comparison
                dep_naive = departure_time.replace(tzinfo=None) if departure_time.tzinfo else departure_time
                minutes_to_dep = (dep_naive - now).total_seconds() / 60.0
                admin_review_req = 'Y' if minutes_to_dep < 60.0 else 'N'
                cancellation_type = 'COORDINATOR' if is_coordinator else 'USER'

                canc_id_var = cur.var(int)
                cur.execute("""
                    INSERT INTO RIDE_CANCELLATION (
                        group_id, cancelled_by, cancellation_reason,
                        cancellation_type, cancelled_at, admin_review_required, review_status
                    )
                    VALUES (
                        :grp_id, :user_id, :reason,
                        :c_type, SYSTIMESTAMP, :rev_req,
                        CASE WHEN :rev_req = 'Y' THEN 'PENDING' ELSE 'NOT_REQUIRED' END
                    )
                    RETURNING cancellation_id INTO :canc_id_var
                """, {
                    "grp_id": group_id,
                    "user_id": cancelled_by_user_id,
                    "reason": reason.strip(),
                    "c_type": cancellation_type,
                    "rev_req": admin_review_req,
                    "canc_id_var": canc_id_var
                })
                canc_id = canc_id_var.getvalue()[0]

                # 4. If admin review is required, create an ADMIN_REVIEW entry
                if admin_review_req == 'Y':
                    cur.execute("""
                        INSERT INTO ADMIN_REVIEW (
                            group_id, cancellation_id, review_reason,
                            review_status, created_at
                        )
                        VALUES (
                            :grp_id, :canc_id, :rev_reason,
                            'PENDING', SYSTIMESTAMP
                        )
                    """, {
                        "grp_id": group_id,
                        "canc_id": canc_id,
                        "rev_reason": f"Late cancellation ({int(minutes_to_dep)} mins before departure): {reason}"
                    })

                # 5. Check if remaining active members < 2
                cur.execute("""
                    SELECT COUNT(*)
                    FROM RIDE_GROUP_MEMBER
                    WHERE group_id = :grp_id
                      AND membership_status IN ('PENDING', 'CONFIRMED')
                """, {"grp_id": group_id})
                remaining_active = cur.fetchone()[0]

                new_coord_id = None
                if is_coordinator and remaining_active > 0:
                    # Automatically trigger coordinator replacement to earliest active passenger
                    out_coord_id = cur.var(int)
                    cur.callproc("REPLACE_COORDINATOR", [group_id, None, out_coord_id])
                    new_coord_id = out_coord_id.getvalue()
                elif remaining_active < 2:
                    # If less than 2 active members remain, shared pool cannot proceed
                    cur.execute("""
                        UPDATE RIDE_GROUP
                        SET group_status = 'CANCELLED'
                        WHERE group_id = :grp_id
                    """, {"grp_id": group_id})

                return {
                    "cancellation_id": canc_id,
                    "admin_review_required": admin_review_req == 'Y',
                    "remaining_active": remaining_active,
                    "new_coordinator_id": new_coord_id
                }

    @staticmethod
    def complete_ride(group_id: int, coordinator_id: int):
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                # Verify user is coordinator
                cur.execute("""
                    SELECT coordinator_id, group_status
                    FROM RIDE_GROUP
                    WHERE group_id = :grp_id
                """, {"grp_id": group_id})
                row = cur.fetchone()
                if not row:
                    raise EntityNotFoundError("Group not found")
                if row[0] != coordinator_id:
                    raise SynRideException("Only the ride coordinator can mark the ride as completed", status_code=403)
                if row[1] != "CONFIRMED":
                    raise SynRideException(f"Cannot complete a ride in {row[1]} status", status_code=400)

                cur.execute("""
                    UPDATE RIDE_GROUP
                    SET group_status = 'COMPLETED'
                    WHERE group_id = :grp_id
                """, {"grp_id": group_id})
