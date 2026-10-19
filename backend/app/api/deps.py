"""
SynRide FastAPI Dependencies
Authentication and role-based authorization guards.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any
from app.core.security import decode_access_token
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.repositories.user_repo import UserRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token")

def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """Validates the JWT token and returns the authenticated user."""
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise AuthenticationError("Could not validate credentials")
    
    user_id = int(payload["sub"])
    user = UserRepository.get_by_id(user_id)
    if not user:
        raise AuthenticationError("User does not exist")
    if user.get("account_status") != "ACTIVE":
        raise AuthorizationError("Account is suspended or closed")
    
    return user

def get_current_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Ensures the authenticated user has ADMIN privileges."""
    if current_user.get("user_role") != "ADMIN":
        raise AuthorizationError("Administrator privileges required")
    return current_user
