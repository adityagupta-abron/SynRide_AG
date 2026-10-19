"""
SynRide Authentication & Account Security API Router
Handles registration, institutional email OTP verification, login, and profiles.
"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict, Any
from datetime import datetime, timezone
from app.core.config import settings
from app.core.security import (
    hash_password, verify_password, create_access_token,
    generate_secure_otp, hash_otp, verify_otp_hash, validate_institutional_email
)
from app.core.exceptions import (
    AuthenticationError, AuthorizationError, SynRideException,
    OTPVerificationError, EntityNotFoundError
)
from app.models.schemas import (
    RegisterRequest, VerifyOTPRequest, ResendOTPRequest, LoginRequest,
    TokenResponse, UserProfileResponse, EmailChangeRequest
)
from app.repositories.user_repo import UserRepository
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# In-memory registration draft store keyed by lowercase email
# Stores encrypted password hash and profile until OTP is verified
_pending_registrations: Dict[str, Dict[str, Any]] = {}

@router.post("/register", status_code=status.HTTP_200_OK)
def register(req: RegisterRequest):
    """
    Step 1 of Registration:
    Validates institutional domain, checks existing users,
    generates secure OTP, and records verification challenge.
    """
    clean_email = req.email.strip().lower()

    # 1. Validate institutional domain
    if not validate_institutional_email(clean_email, req.user_role):
        domain_hint = "@vitstudent.ac.in for students" if req.user_role == "STUDENT" else "@vit.ac.in for faculty/staff"
        raise SynRideException(
            f"Registration requires a valid institutional email ({domain_hint}).",
            status_code=400,
            error_code="INVALID_INSTITUTIONAL_EMAIL"
        )

    # 2. Check if user already exists
    existing = UserRepository.get_by_email(clean_email)
    if existing:
        raise SynRideException(
            "An account with this institutional email already exists.",
            status_code=409,
            error_code="EMAIL_ALREADY_EXISTS"
        )

    # 3. Store pending registration details
    hashed_pwd = hash_password(req.password)
    _pending_registrations[clean_email] = {
        "full_name": req.full_name,
        "email": clean_email,
        "password_hash": hashed_pwd,
        "user_role": req.user_role,
        "student_profile": req.student_profile.model_dump() if req.student_profile else None,
        "faculty_profile": req.faculty_profile.model_dump() if req.faculty_profile else None
    }

    # 4. Generate cryptographically secure OTP & store hash
    otp = generate_secure_otp()
    otp_hash = hash_otp(otp, clean_email)
    UserRepository.record_otp_verification(
        email=clean_email,
        otp_hash=otp_hash,
        verification_type="REGISTRATION",
        expire_minutes=settings.OTP_EXPIRE_MINUTES
    )

    response = {
        "message": f"Verification OTP sent to {clean_email}. Valid for 10 minutes.",
        "email": clean_email
    }
    # In development mode, provide simulated OTP for evaluation convenience
    if settings.APP_ENV == "development":
        response["dev_otp"] = otp

    return response

@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(req: VerifyOTPRequest):
    """
    Step 2 of Registration:
    Validates OTP, enforces 5-attempt lockout, creates APP_USER and profile,
    and returns JWT access token.
    """
    clean_email = req.email.strip().lower()

    otp_record = UserRepository.get_latest_pending_otp(clean_email)
    if not otp_record:
        raise OTPVerificationError("No pending verification request found for this email.")

    # 1. Check if blocked from too many failed attempts
    if otp_record.get("failed_attempts", 0) >= settings.MAX_OTP_ATTEMPTS:
        raise SynRideException(
            f"Too many failed verification attempts. Blocked for {settings.OTP_LOCKOUT_MINUTES} minutes.",
            status_code=429,
            error_code="OTP_ATTEMPTS_EXCEEDED"
        )

    # 2. Check expiration
    expires_at = otp_record.get("expires_at")
    if expires_at and datetime.now() > (expires_at.replace(tzinfo=None) if expires_at.tzinfo else expires_at):
        raise OTPVerificationError("Verification code has expired. Please request a new code.")

    # 3. Validate OTP
    stored_hash = otp_record.get("otp_hash")
    if not verify_otp_hash(req.otp.strip(), clean_email, stored_hash):
        UserRepository.increment_otp_failed_attempts(otp_record["verification_id"], settings.MAX_OTP_ATTEMPTS)
        remaining = settings.MAX_OTP_ATTEMPTS - (otp_record.get("failed_attempts", 0) + 1)
        raise OTPVerificationError(f"Incorrect verification code. {remaining} attempt(s) remaining.")

    # Mark OTP verified
    UserRepository.mark_otp_verified(otp_record["verification_id"])

    # 4. Create User and Subtype record from pending registration
    reg_data = _pending_registrations.get(clean_email)
    if not reg_data:
        raise SynRideException("Registration session expired. Please register again.", status_code=400)

    new_user_id = UserRepository.create_user_with_profile(
        full_name=reg_data["full_name"],
        email=reg_data["email"],
        password_hash=reg_data["password_hash"],
        user_role=reg_data["user_role"],
        student_profile=reg_data.get("student_profile"),
        faculty_profile=reg_data.get("faculty_profile")
    )

    # Clean up pending draft
    _pending_registrations.pop(clean_email, None)

    # 5. Issue JWT Access Token
    token = create_access_token({"sub": str(new_user_id), "role": reg_data["user_role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": new_user_id,
        "full_name": reg_data["full_name"],
        "email": clean_email,
        "user_role": reg_data["user_role"]
    }

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest):
    """Authenticates an active user using email and password."""
    clean_email = req.email.strip().lower()
    user = UserRepository.get_by_email(clean_email)
    if not user:
        raise AuthenticationError("Invalid institutional email or password.")

    if user.get("account_status") != "ACTIVE":
        raise AuthorizationError(f"Account is {user.get('account_status').lower()}. Access denied.")

    # Test users have placeholder hashes; allow standard verify or dev password
    is_valid = False
    stored_hash = user.get("password_hash")
    if stored_hash.startswith("$2b$") or stored_hash.startswith("$2a$"):
        is_valid = verify_password(req.password, stored_hash)
    elif settings.APP_ENV == "development" and req.password in ("Password@123", "SynRide123", "oracle"):
        is_valid = True

    if not is_valid:
        raise AuthenticationError("Invalid institutional email or password.")

    token = create_access_token({"sub": str(user["user_id"]), "role": user["user_role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user["user_id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "user_role": user["user_role"]
    }

@router.post("/token", response_model=TokenResponse)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 compatible token login for OpenAPI / Swagger documentation."""
    return login(LoginRequest(email=form_data.username, password=form_data.password))

@router.get("/me", response_model=UserProfileResponse)
def get_my_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieves full profile of the authenticated user including specialization attributes."""
    profile = UserRepository.get_profile_by_id(current_user["user_id"])
    if not profile:
        raise EntityNotFoundError("Profile not found")
    return profile
