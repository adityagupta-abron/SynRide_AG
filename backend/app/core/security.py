"""
SynRide Security & Cryptography Utilities
Password hashing, JWT handling, secure OTP generation, and email verification.
"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import bcrypt
import jwt
from app.core.config import settings

ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and validates a JWT access token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def generate_secure_otp() -> str:
    """Generates a cryptographically secure 6-digit OTP."""
    # secrets.randbelow ensures uniform cryptographic randomness without predictability
    return f"{secrets.randbelow(1_000_000):06d}"

def hash_otp(otp: str, email: str) -> str:
    """Generates a secure SHA-256 hash of the OTP salted with the target email."""
    salt = f"synride_salt_{email.strip().lower()}"
    return hashlib.sha256(f"{otp}:{salt}".encode("utf-8")).hexdigest()

def verify_otp_hash(otp: str, email: str, stored_hash: str) -> bool:
    """Validates an entered OTP against the stored salted hash."""
    computed = hash_otp(otp, email)
    return secrets.compare_digest(computed, stored_hash)

def validate_institutional_email(email: str, role: str) -> bool:
    """
    Validates institutional email requirements:
    - Students must use @vitstudent.ac.in
    - Faculty/Staff must use @vit.ac.in
    - Admin can be @vit.ac.in or designated domain
    """
    email_clean = email.strip().lower()
    if role == "STUDENT":
        return email_clean.endswith("@vitstudent.ac.in")
    elif role in ("FACULTY", "ADMIN"):
        return email_clean.endswith("@vit.ac.in") or email_clean.endswith("@vitstudent.ac.in")
    return False
