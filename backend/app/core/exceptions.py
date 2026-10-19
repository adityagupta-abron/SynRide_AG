"""
SynRide Domain & API Exceptions
Maps business and database rules to clean, informative HTTP status codes.
"""
from fastapi import HTTPException, status

class SynRideException(Exception):
    """Base exception for all SynRide domain errors."""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, error_code: str = "BAD_REQUEST"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code

class EntityNotFoundError(SynRideException):
    def __init__(self, message: str = "Requested resource not found"):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND, error_code="NOT_FOUND")

class AuthenticationError(SynRideException):
    def __init__(self, message: str = "Invalid credentials or token expired"):
        super().__init__(message, status_code=status.HTTP_401_UNAUTHORIZED, error_code="UNAUTHORIZED")

class AuthorizationError(SynRideException):
    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN, error_code="FORBIDDEN")

class CapacityExceededError(SynRideException):
    def __init__(self, message: str = "Ride group has reached its maximum capacity of 3 members"):
        super().__init__(message, status_code=status.HTTP_409_CONFLICT, error_code="CAPACITY_EXCEEDED")

class DuplicateMembershipError(SynRideException):
    def __init__(self, message: str = "User already has an active membership in this group"):
        super().__init__(message, status_code=status.HTTP_409_CONFLICT, error_code="DUPLICATE_MEMBERSHIP")

class ConfirmationDeadlineError(SynRideException):
    def __init__(self, message: str = "Confirmation deadline has passed"):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST, error_code="DEADLINE_PASSED")

class OverlappingRideError(SynRideException):
    def __init__(self, message: str = "You already have another confirmed or pending ride during this time window"):
        super().__init__(message, status_code=status.HTTP_409_CONFLICT, error_code="OVERLAPPING_RIDE")

class OTPVerificationError(SynRideException):
    def __init__(self, message: str = "Invalid or expired verification code"):
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST, error_code="OTP_INVALID")

class DatabaseTransactionError(SynRideException):
    def __init__(self, message: str = "A database error occurred during transaction"):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, error_code="DB_ERROR")
