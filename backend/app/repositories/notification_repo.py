"""
SynRide Notifications & Email Delivery Logging Repository
Tracks in-app notifications, persistent email preferences, and delivery retry schedules.
"""
from typing import Dict, Any, List, Optional
from app.db.connection import get_db_connection, get_db_transaction, row_to_dict, rows_to_dicts

class NotificationRepository:

    @staticmethod
    def create_notification(
        user_id: int,
        notification_type: str,
        message: str,
        group_id: Optional[int] = None
    ) -> int:
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                # 1. Insert into APP_NOTIFICATION
                notif_id_var = cur.var(int)
                cur.execute("""
                    INSERT INTO APP_NOTIFICATION (
                        user_id, group_id, notification_type, message, is_read, created_at
                    )
                    VALUES (
                        :uid, :grp_id, :n_type, :msg, 'N', SYSTIMESTAMP
                    )
                    RETURNING notification_id INTO :notif_id_var
                """, {
                    "uid": user_id,
                    "grp_id": group_id,
                    "n_type": notification_type,
                    "msg": message.strip(),
                    "notif_id_var": notif_id_var
                })
                notif_id = notif_id_var.getvalue()[0]

                # 2. Check user's email preference
                cur.execute("""
                    SELECT email_enabled
                    FROM EMAIL_PREFERENCE
                    WHERE user_id = :v_user_id
                """, {"v_user_id": user_id})
                row = cur.fetchone()
                email_enabled = (row[0] == 'Y') if row else True

                # 3. If email enabled, create an EMAIL_DELIVERY_LOG entry
                if email_enabled:
                    cur.execute("""
                        INSERT INTO EMAIL_DELIVERY_LOG (
                            notification_id, recipient_user_id, email_subject,
                            attempt_count, delivery_status, created_at
                        )
                        VALUES (
                            :notif_id, :v_user_id, :subj,
                            0, 'PENDING', SYSTIMESTAMP
                        )
                    """, {
                        "notif_id": notif_id,
                        "v_user_id": user_id,
                        "subj": f"SynRide Notification: {notification_type}"
                    })

                return notif_id

    @staticmethod
    def list_user_notifications(user_id: int) -> List[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT notification_id, user_id, group_id, notification_type, message, is_read, created_at
                    FROM APP_NOTIFICATION
                    WHERE user_id = :v_user_id
                    ORDER BY created_at DESC
                """, {"v_user_id": user_id})
                return rows_to_dicts(cur)

    @staticmethod
    def mark_as_read(notification_id: int, user_id: int):
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE APP_NOTIFICATION
                    SET is_read = 'Y'
                    WHERE notification_id = :notif_id
                      AND user_id = :v_user_id
                """, {"notif_id": notification_id, "v_user_id": user_id})

    @staticmethod
    def get_email_preference(user_id: int) -> bool:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT email_enabled
                    FROM EMAIL_PREFERENCE
                    WHERE user_id = :v_user_id
                """, {"v_user_id": user_id})
                row = cur.fetchone()
                return (row[0] == 'Y') if row else True

    @staticmethod
    def update_email_preference(user_id: int, email_enabled: bool):
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                val = 'Y' if email_enabled else 'N'
                cur.execute("""
                    UPDATE EMAIL_PREFERENCE
                    SET email_enabled = :v_enabled, updated_at = SYSTIMESTAMP
                    WHERE user_id = :v_user_id
                """, {"v_user_id": user_id, "v_enabled": val})
                if cur.rowcount == 0:
                    cur.execute("""
                        INSERT INTO EMAIL_PREFERENCE (user_id, email_enabled, updated_at)
                        VALUES (:v_user_id, :v_enabled, SYSTIMESTAMP)
                    """, {"v_user_id": user_id, "v_enabled": val})
