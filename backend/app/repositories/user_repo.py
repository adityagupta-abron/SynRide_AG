"""
SynRide User & Authentication Repository
Direct, parameterized SQL queries for APP_USER, STUDENT_PROFILE, FACULTY_PROFILE,
USER_EMAIL_VERIFICATION, and USER_EMAIL_ACCOUNT.
"""
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone
from app.db.connection import get_db_connection, get_db_transaction, row_to_dict, rows_to_dicts
from app.core.exceptions import EntityNotFoundError, SynRideException

class UserRepository:

    @staticmethod
    def get_by_email(email: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT user_id, full_name, email, password_hash, user_role, account_status, created_at
                    FROM APP_USER
                    WHERE LOWER(email) = LOWER(:email)
                """, {"email": email.strip()})
                return row_to_dict(cur)

    @staticmethod
    def get_by_id(user_id: int) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT user_id, full_name, email, user_role, account_status, created_at
                    FROM APP_USER
                    WHERE user_id = :user_id
                """, {"user_id": user_id})
                return row_to_dict(cur)

    @staticmethod
    def get_profile_by_id(user_id: int) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT p.*,
                           NVL(r.average_rating, 0.0) AS average_rating,
                           NVL(r.total_reviews, 0) AS total_reviews
                    FROM V_USER_PROFILES p
                    LEFT JOIN V_USER_RATINGS_SUMMARY r ON p.user_id = r.user_id
                    WHERE p.user_id = :user_id
                """, {"user_id": user_id})
                return row_to_dict(cur)

    @staticmethod
    def create_user_with_profile(
        full_name: str,
        email: str,
        password_hash: str,
        user_role: str,
        student_profile: Optional[Dict[str, Any]] = None,
        faculty_profile: Optional[Dict[str, Any]] = None
    ) -> int:
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                # 1. Insert APP_USER (supertype)
                user_id_var = cur.var(int)
                cur.execute("""
                    INSERT INTO APP_USER (full_name, email, password_hash, user_role, account_status, created_at)
                    VALUES (:full_name, :email, :password_hash, :user_role, 'ACTIVE', SYSTIMESTAMP)
                    RETURNING user_id INTO :user_id_var
                """, {
                    "full_name": full_name.strip(),
                    "email": email.strip().lower(),
                    "password_hash": password_hash,
                    "user_role": user_role,
                    "user_id_var": user_id_var
                })
                new_user_id = user_id_var.getvalue()[0]

                # 2. Insert Subtype Record
                if user_role == "STUDENT" and student_profile:
                    cur.execute("""
                        INSERT INTO STUDENT_PROFILE (user_id, registration_no, programme, study_year)
                        VALUES (:user_id, :reg_no, :prog, :year)
                    """, {
                        "user_id": new_user_id,
                        "reg_no": student_profile["registration_no"].strip().upper(),
                        "prog": student_profile.get("programme"),
                        "year": student_profile.get("study_year")
                    })
                elif user_role == "FACULTY" and faculty_profile:
                    cur.execute("""
                        INSERT INTO FACULTY_PROFILE (user_id, employee_id, staff_category, department)
                        VALUES (:user_id, :emp_id, :cat, :dept)
                    """, {
                        "user_id": new_user_id,
                        "emp_id": faculty_profile["employee_id"].strip().upper(),
                        "cat": faculty_profile["staff_category"],
                        "dept": faculty_profile.get("department")
                    })

                # 3. Initialize USER_EMAIL_ACCOUNT
                cur.execute("""
                    INSERT INTO USER_EMAIL_ACCOUNT (user_id, verified_email, email_verified_at, updated_at)
                    VALUES (:user_id, :email, SYSTIMESTAMP, SYSTIMESTAMP)
                """, {"user_id": new_user_id, "email": email.strip().lower()})

                # 4. Initialize default EMAIL_PREFERENCE
                cur.execute("""
                    INSERT INTO EMAIL_PREFERENCE (user_id, email_enabled, updated_at)
                    VALUES (:user_id, 'Y', SYSTIMESTAMP)
                """, {"user_id": new_user_id})

                return new_user_id

    @staticmethod
    def record_otp_verification(
        email: str,
        otp_hash: str,
        verification_type: str = "REGISTRATION",
        user_id: Optional[int] = None,
        expire_minutes: int = 10
    ):
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                # Invalidate any previously pending OTP for this email
                cur.execute("""
                    UPDATE USER_EMAIL_VERIFICATION
                    SET verification_status = 'INVALIDATED'
                    WHERE LOWER(email_address) = LOWER(:email)
                      AND verification_status = 'PENDING'
                """, {"email": email.strip().lower()})

                # Insert new OTP record
                cur.execute("""
                    INSERT INTO USER_EMAIL_VERIFICATION (
                        user_id, email_address, verification_type, otp_hash,
                        expires_at, failed_attempts, verification_status, created_at
                    )
                    VALUES (
                        :user_id, :email, :v_type, :otp_hash,
                        SYSTIMESTAMP + NUMTODSINTERVAL(:expire_mins, 'MINUTE'),
                        0, 'PENDING', SYSTIMESTAMP
                    )
                """, {
                    "user_id": user_id,
                    "email": email.strip().lower(),
                    "v_type": verification_type,
                    "otp_hash": otp_hash,
                    "expire_mins": expire_minutes
                })

    @staticmethod
    def get_latest_pending_otp(email: str) -> Optional[Dict[str, Any]]:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT verification_id, user_id, email_address, verification_type,
                           otp_hash, expires_at, failed_attempts, verification_status, created_at
                    FROM USER_EMAIL_VERIFICATION
                    WHERE LOWER(email_address) = LOWER(:email)
                      AND verification_status IN ('PENDING', 'BLOCKED')
                    ORDER BY created_at DESC
                    FETCH FIRST 1 ROWS ONLY
                """, {"email": email.strip().lower()})
                return row_to_dict(cur)

    @staticmethod
    def increment_otp_failed_attempts(verification_id: int, max_attempts: int = 5):
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE USER_EMAIL_VERIFICATION
                    SET failed_attempts = failed_attempts + 1,
                        verification_status = CASE WHEN failed_attempts + 1 >= :max_att THEN 'BLOCKED' ELSE 'PENDING' END
                    WHERE verification_id = :v_id
                """, {"v_id": verification_id, "max_att": max_attempts})

    @staticmethod
    def mark_otp_verified(verification_id: int):
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE USER_EMAIL_VERIFICATION
                    SET verification_status = 'VERIFIED'
                    WHERE verification_id = :v_id
                """, {"v_id": verification_id})

    @staticmethod
    def update_user_password(user_id: int, password_hash: str):
        with get_db_transaction() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    UPDATE APP_USER
                    SET password_hash = :p_hash
                    WHERE user_id = :user_id
                """, {"p_hash": password_hash, "user_id": user_id})
