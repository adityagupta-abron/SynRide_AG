"""
SynRide Fares & Payments Repository
Executes CALCULATE_AND_ALLOCATE_FARE stored procedure and manages simulated payment records.
"""
from typing import Dict, Any, List
from app.db.connection import get_db_connection, get_db_transaction, rows_to_dicts, row_to_dict

class FareRepository:

    @staticmethod
    def calculate_and_allocate_fare(group_id: int, actual_fare: float) -> Dict[str, Any]:
        """
        Calculates exact individual shares summing to actual fare, remainder to coordinator.
        Flags discrepancy if difference > 25% from estimated fare.
        """
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                out_flag = cur.var(str)
                cur.callproc("CALCULATE_AND_ALLOCATE_FARE", [group_id, actual_fare, out_flag])
                discrepancy = out_flag.getvalue().strip()

                # Fetch updated shares
                cur.execute("""
                    SELECT fs.fare_share_id, fs.group_id, fs.membership_id,
                           m.user_id, u.full_name, m.member_role,
                           fs.share_amount, fs.payment_status, fs.created_at
                    FROM FARE_SHARE fs
                    JOIN RIDE_GROUP_MEMBER m ON fs.membership_id = m.membership_id
                    JOIN APP_USER u ON m.user_id = u.user_id
                    WHERE fs.group_id = :grp_id
                    ORDER BY fs.fare_share_id ASC
                """, {"grp_id": group_id})
                shares = rows_to_dicts(cur)

                return {
                    "group_id": group_id,
                    "actual_fare": actual_fare,
                    "discrepancy_flag": discrepancy,
                    "message": "Fare allocated successfully" if discrepancy == "N" else "Fare allocated; note >25% discrepancy flagged for review",
                    "shares": shares
                }

    @staticmethod
    def get_fare_shares(group_id: int) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT fs.fare_share_id, fs.group_id, fs.membership_id,
                           m.user_id, u.full_name, m.member_role,
                           fs.share_amount, fs.payment_status, fs.created_at
                    FROM FARE_SHARE fs
                    JOIN RIDE_GROUP_MEMBER m ON fs.membership_id = m.membership_id
                    JOIN APP_USER u ON m.user_id = u.user_id
                    WHERE fs.group_id = :grp_id
                    ORDER BY fs.fare_share_id ASC
                """, {"grp_id": group_id})
                return rows_to_dicts(cur)

    @staticmethod
    def update_payment_status(membership_id: int, new_status: str) -> Dict[str, Any]:
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE FARE_SHARE
                    SET payment_status = :status
                    WHERE membership_id = :mem_id
                """, {"status": new_status, "mem_id": membership_id})

                cur.execute("""
                    SELECT *
                    FROM FARE_SHARE
                    WHERE membership_id = :mem_id
                """, {"mem_id": membership_id})
                return row_to_dict(cur)
