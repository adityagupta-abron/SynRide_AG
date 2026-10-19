"""
SynRide Administrator Operations Repository
Provides operational metrics, review queue management, and route-fare configuration.
"""
from typing import Dict, Any, List, Optional
from app.db.connection import get_db_connection, get_db_transaction, row_to_dict, rows_to_dicts
from app.core.exceptions import SynRideException, EntityNotFoundError

class AdminRepository:

    @staticmethod
    def get_dashboard_metrics() -> Dict[str, Any]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT COUNT(*) FROM APP_USER")
                total_users = cur.fetchone()[0]

                cur.execute("SELECT COUNT(*) FROM RIDE_GROUP WHERE group_status IN ('PENDING', 'CONFIRMED')")
                active_groups = cur.fetchone()[0]

                cur.execute("SELECT COUNT(*) FROM RIDE_GROUP WHERE group_status = 'COMPLETED'")
                completed_rides = cur.fetchone()[0]

                cur.execute("SELECT COUNT(*) FROM ADMIN_REVIEW WHERE review_status IN ('PENDING', 'UNDER_REVIEW')")
                pending_reviews = cur.fetchone()[0]

                cur.execute("SELECT COUNT(*) FROM ROUTE_FARE WHERE is_active = 'Y'")
                total_routes = cur.fetchone()[0]

                return {
                    "total_users": total_users,
                    "active_groups": active_groups,
                    "completed_rides": completed_rides,
                    "pending_admin_reviews": pending_reviews,
                    "total_routes": total_routes
                }

    @staticmethod
    def list_review_queue() -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT *
                    FROM V_ADMIN_REVIEW_QUEUE
                    ORDER BY created_at DESC
                """)
                return rows_to_dicts(cur)

    @staticmethod
    def resolve_review(
        review_id: int,
        admin_id: int,
        status: str,
        outcome_note: str
    ) -> Dict[str, Any]:
        if not outcome_note or len(outcome_note.strip()) < 5:
            raise SynRideException("Outcome note of at least 5 characters is mandatory", status_code=400)

        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE ADMIN_REVIEW
                    SET review_status = :status,
                        assigned_admin_id = :admin_id,
                        outcome_note = :note,
                        reviewed_at = SYSTIMESTAMP
                    WHERE review_id = :rev_id
                """, {"status": status, "admin_id": admin_id, "note": outcome_note.strip(), "rev_id": review_id})

                # If tied to a report, keep report status synced
                cur.execute("""
                    UPDATE RIDE_REPORT
                    SET report_status = :status,
                        admin_outcome_note = :note,
                        resolved_at = SYSTIMESTAMP
                    WHERE report_id = (SELECT report_id FROM ADMIN_REVIEW WHERE review_id = :rev_id)
                """, {"status": status, "note": outcome_note.strip(), "rev_id": review_id})

                # If tied to a cancellation, update cancellation review status
                cur.execute("""
                    UPDATE RIDE_CANCELLATION
                    SET review_status = :status
                    WHERE cancellation_id = (SELECT cancellation_id FROM ADMIN_REVIEW WHERE review_id = :rev_id)
                """, {"status": status, "rev_id": review_id})

                cur.execute("SELECT * FROM V_ADMIN_REVIEW_QUEUE WHERE review_id = :rev_id", {"rev_id": review_id})
                return row_to_dict(cur)

    @staticmethod
    def upsert_route_fare(
        pickup: str,
        dest: str,
        fare: float,
        duration: int,
        is_active: str = 'Y'
    ) -> Dict[str, Any]:
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    MERGE INTO ROUTE_FARE rf
                    USING DUAL
                    ON (LOWER(rf.pickup_location) = LOWER(:pickup) AND LOWER(rf.destination) = LOWER(:dest))
                    WHEN MATCHED THEN
                        UPDATE SET 
                            rf.estimated_fare = :fare,
                            rf.estimated_duration_minutes = :duration,
                            rf.is_active = :active,
                            rf.updated_at = SYSTIMESTAMP
                    WHEN NOT MATCHED THEN
                        INSERT (pickup_location, destination, estimated_fare, estimated_duration_minutes, is_active, updated_at)
                        VALUES (:pickup, :dest, :fare, :duration, :active, SYSTIMESTAMP)
                """, {
                    "pickup": pickup.strip(),
                    "dest": dest.strip(),
                    "fare": fare,
                    "duration": duration,
                    "active": is_active
                })

                cur.execute("""
                    SELECT * FROM ROUTE_FARE 
                    WHERE LOWER(pickup_location) = LOWER(:pickup) AND LOWER(destination) = LOWER(:dest)
                """, {"pickup": pickup.strip(), "dest": dest.strip()})
                return row_to_dict(cur)

    @staticmethod
    def list_all_users() -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT user_id, full_name, email, user_role, account_status, created_at,
                           profile_type, institutional_id, programme, study_year, staff_category, department
                    FROM V_USER_PROFILES
                    ORDER BY user_id ASC
                """)
                return rows_to_dicts(cur)
