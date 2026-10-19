"""
SynRide Reports & Incident Logging Repository
Manages peer reports, mandatory outcome notes for resolution, and ADMIN_REVIEW linking.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.db.connection import get_db_connection, get_db_transaction, row_to_dict, rows_to_dicts
from app.core.exceptions import SynRideException, EntityNotFoundError

class ReportRepository:

    @staticmethod
    def create_report(
        reporter_id: int,
        report_reason: str,
        group_id: Optional[int] = None,
        reported_user_id: Optional[int] = None,
        description: Optional[str] = None
    ) -> int:
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                if reported_user_id and reporter_id == reported_user_id:
                    raise SynRideException("You cannot report yourself", status_code=400)

                # 1. Insert into RIDE_REPORT
                rep_id_var = cur.var(int)
                cur.execute("""
                    INSERT INTO RIDE_REPORT (
                        group_id, reporter_id, reported_user_id,
                        report_reason, description, report_status, created_at
                    )
                    VALUES (
                        :grp_id, :rep_id, :reported_id,
                        :reason, :report_desc, 'PENDING', SYSTIMESTAMP
                    )
                    RETURNING report_id INTO :rep_id_var
                """, {
                    "grp_id": group_id,
                    "rep_id": reporter_id,
                    "reported_id": reported_user_id,
                    "reason": report_reason.strip(),
                    "report_desc": description.strip() if description else None,
                    "rep_id_var": rep_id_var
                })
                report_id = rep_id_var.getvalue()[0]

                # 2. Automatically create entry in ADMIN_REVIEW queue
                cur.execute("""
                    INSERT INTO ADMIN_REVIEW (
                        group_id, report_id, review_reason,
                        review_status, created_at
                    )
                    VALUES (
                        :grp_id, :rep_id, :rev_reason,
                        'PENDING', SYSTIMESTAMP
                    )
                """, {
                    "grp_id": group_id,
                    "rep_id": report_id,
                    "rev_reason": f"Incident Report: {report_reason}"
                })

                return report_id

    @staticmethod
    def list_reports() -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        r.report_id,
                        r.group_id,
                        r.reporter_id,
                        u1.full_name AS reporter_name,
                        r.reported_user_id,
                        u2.full_name AS reported_user_name,
                        r.report_reason,
                        r.description,
                        r.report_status,
                        r.admin_outcome_note,
                        r.created_at,
                        r.resolved_at
                    FROM RIDE_REPORT r
                    JOIN APP_USER u1 ON r.reporter_id = u1.user_id
                    LEFT JOIN APP_USER u2 ON r.reported_user_id = u2.user_id
                    ORDER BY r.created_at DESC
                """)
                return rows_to_dicts(cur)

    @staticmethod
    def resolve_report(
        report_id: int,
        admin_id: int,
        status: str,
        outcome_note: str
    ) -> Dict[str, Any]:
        """Resolves or dismisses a report with mandatory administrative outcome note."""
        if not outcome_note or len(outcome_note.strip()) < 5:
            raise SynRideException("An administrative outcome note of at least 5 characters is mandatory", status_code=400)

        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE RIDE_REPORT
                    SET report_status = :status,
                        admin_outcome_note = :note,
                        resolved_at = SYSTIMESTAMP
                    WHERE report_id = :rep_id
                """, {"status": status, "note": outcome_note.strip(), "rep_id": report_id})

                cur.execute("""
                    UPDATE ADMIN_REVIEW
                    SET review_status = :status,
                        assigned_admin_id = :admin_id,
                        outcome_note = :note,
                        reviewed_at = SYSTIMESTAMP
                    WHERE report_id = :rep_id
                """, {"status": status, "admin_id": admin_id, "note": outcome_note.strip(), "rep_id": report_id})

                cur.execute("SELECT * FROM RIDE_REPORT WHERE report_id = :rep_id", {"rep_id": report_id})
                return row_to_dict(cur)
