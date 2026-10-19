"""
SynRide Confirmations Repository
Executes stored procedures for SET_CONFIRMATION_DEADLINE, RECORD_RIDE_CONFIRMATION,
DECLINE_RIDE_CONFIRMATION, CONFIRM_RIDE_GROUP, and EXPIRE_UNCONFIRMED_GROUP.
"""
from typing import Dict, Any
from app.db.connection import get_db_transaction, handle_oracle_error

class ConfirmationRepository:

    @staticmethod
    def set_confirmation_deadline(group_id: int):
        """Sets a 10-minute confirmation window via PL/SQL."""
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                cur.callproc("SET_CONFIRMATION_DEADLINE", [group_id])

    @staticmethod
    def record_confirmation(membership_id: int, group_id: int) -> Dict[str, Any]:
        """
        Records a member confirmation and automatically checks whether
        all active members have confirmed, transitioning the group to CONFIRMED.
        """
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                # 1. Record individual confirmation
                cur.callproc("RECORD_RIDE_CONFIRMATION", [membership_id])

                # 2. Check if all active members have confirmed
                cur.execute("""
                    SELECT 
                        COUNT(*),
                        SUM(CASE WHEN c.confirmation_status = 'CONFIRMED' THEN 1 ELSE 0 END)
                    FROM RIDE_GROUP_MEMBER m
                    JOIN RIDE_CONFIRMATION c ON c.membership_id = m.membership_id
                    WHERE m.group_id = :grp_id
                      AND m.membership_status IN ('PENDING', 'CONFIRMED')
                """, {"grp_id": group_id})
                total, confirmed = cur.fetchone()

                group_confirmed = False
                if total >= 2 and total == confirmed:
                    # Transition group to CONFIRMED
                    cur.callproc("CONFIRM_RIDE_GROUP", [group_id])
                    group_confirmed = True

                return {
                    "membership_id": membership_id,
                    "group_id": group_id,
                    "total_members": total,
                    "confirmed_members": confirmed,
                    "group_confirmed": group_confirmed
                }

    @staticmethod
    def decline_confirmation(membership_id: int):
        """Declines participation without immediately expiring the group."""
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                cur.callproc("DECLINE_RIDE_CONFIRMATION", [membership_id])

    @staticmethod
    def expire_unconfirmed_group(group_id: int):
        """Expires group if deadline passed and confirmations remain pending."""
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                cur.callproc("EXPIRE_UNCONFIRMED_GROUP", [group_id])
