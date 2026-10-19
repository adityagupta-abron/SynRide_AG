"""
SynRide Ratings & Peer Reviews Repository
Manages post-ride 1-5 star ratings, enforces one-rating-per-pair, prevents self-rating,
and hides reviewer identities from non-admin users.
"""
from typing import Dict, Any, List, Optional
from app.db.connection import get_db_connection, get_db_transaction, row_to_dict, rows_to_dicts
from app.core.exceptions import SynRideException, EntityNotFoundError

class RatingRepository:

    @staticmethod
    def create_rating(
        group_id: int,
        reviewer_membership_id: int,
        reviewed_membership_id: int,
        rating: int,
        review_text: Optional[str] = None
    ) -> int:
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                # 1. Verify group is COMPLETED
                cur.execute("""
                    SELECT group_status
                    FROM RIDE_GROUP
                    WHERE group_id = :grp_id
                """, {"grp_id": group_id})
                row = cur.fetchone()
                if not row:
                    raise EntityNotFoundError("Group not found")
                if row[0] != "COMPLETED":
                    raise SynRideException("Ratings can only be submitted after the ride is marked COMPLETED", status_code=400)

                # 2. Check for completion disputes
                cur.execute("""
                    SELECT COUNT(*)
                    FROM ADMIN_REVIEW
                    WHERE group_id = :grp_id
                      AND review_reason LIKE '%completion%'
                      AND review_status IN ('PENDING', 'UNDER_REVIEW')
                """, {"grp_id": group_id})
                if cur.fetchone()[0] > 0:
                    raise SynRideException("Ratings are suspended while ride completion is under dispute review", status_code=400)

                # 3. Verify self-rating prohibition
                if reviewer_membership_id == reviewed_membership_id:
                    raise SynRideException("Self-rating is prohibited", status_code=400)

                # 4. Insert rating
                rating_id_var = cur.var(int)
                cur.execute("""
                    INSERT INTO RIDE_RATING (
                        group_id, reviewer_membership_id, reviewed_membership_id,
                        rating, review_text, created_at
                    )
                    VALUES (
                        :grp_id, :rev_by, :rev_to,
                        :rating, :txt, SYSTIMESTAMP
                    )
                    RETURNING rating_id INTO :rating_id_var
                """, {
                    "grp_id": group_id,
                    "rev_by": reviewer_membership_id,
                    "rev_to": reviewed_membership_id,
                    "rating": rating,
                    "txt": review_text.strip() if review_text else None,
                    "rating_id_var": rating_id_var
                })
                return rating_id_var.getvalue()[0]

    @staticmethod
    def get_user_ratings(user_id: int, is_admin: bool = False) -> List[Dict[str, Any]]:
        """
        Lists ratings received by user.
        If is_admin is False, masks reviewer identity for privacy.
        """
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        r.rating_id,
                        r.group_id,
                        r.rating,
                        r.review_text,
                        r.created_at,
                        CASE 
                            WHEN :is_admin = 1 THEN reviewer_u.full_name 
                            ELSE 'Anonymous Participant' 
                        END AS reviewer_name
                    FROM RIDE_RATING r
                    JOIN RIDE_GROUP_MEMBER reviewed_m ON r.reviewed_membership_id = reviewed_m.membership_id
                    JOIN RIDE_GROUP_MEMBER reviewer_m ON r.reviewer_membership_id = reviewer_m.membership_id
                    JOIN APP_USER reviewer_u ON reviewer_m.user_id = reviewer_u.user_id
                    WHERE reviewed_m.user_id = :user_id
                    ORDER BY r.created_at DESC
                """, {"user_id": user_id, "is_admin": 1 if is_admin else 0})
                return rows_to_dicts(cur)
