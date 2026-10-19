"""
SynRide Pydantic Schemas
Defines request validation and response models for all API domains.
"""
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

# ==========================================
# AUTH & USER SCHEMAS
# ==========================================

class StudentProfileInput(BaseModel):
    registration_no: str = Field(..., min_length=3, max_length=30)
    programme: Optional[str] = Field(None, max_length=100)
    study_year: Optional[int] = Field(None, ge=1, le=6)

class FacultyProfileInput(BaseModel):
    employee_id: str = Field(..., min_length=3, max_length=30)
    staff_category: str = Field(..., pattern="^(TEACHING|NON_TEACHING)$")
    department: Optional[str] = Field(None, max_length=100)

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    user_role: str = Field(..., pattern="^(STUDENT|FACULTY)$")
    student_profile: Optional[StudentProfileInput] = None
    faculty_profile: Optional[FacultyProfileInput] = None

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6)

class ResendOTPRequest(BaseModel):
    email: EmailStr

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    full_name: str
    email: str
    user_role: str

class UserProfileResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    user_role: str
    account_status: str
    created_at: datetime
    profile_type: Optional[str] = None
    institutional_id: Optional[str] = None
    programme: Optional[str] = None
    study_year: Optional[int] = None
    staff_category: Optional[str] = None
    department: Optional[str] = None
    average_rating: Optional[float] = 0.0
    total_reviews: Optional[int] = 0

class EmailChangeRequest(BaseModel):
    new_email: EmailStr

class EmailPreferenceUpdate(BaseModel):
    email_enabled: bool

# ==========================================
# RIDE & ROUTE SCHEMAS
# ==========================================

class RouteFareResponse(BaseModel):
    route_id: int
    pickup_location: str
    destination: str
    estimated_fare: float
    estimated_duration_minutes: Optional[int] = 15
    is_active: str

class RideRequestCreate(BaseModel):
    request_type: str = Field(..., pattern="^(LOOKING_FOR_COMPANIONS|VEHICLE_ARRANGED)$")
    pickup_location: str = Field(..., min_length=2, max_length=200)
    destination: str = Field(..., min_length=2, max_length=200)
    departure_time: datetime

    @field_validator("destination")
    @classmethod
    def validate_locations(cls, v: str, info):
        if "pickup_location" in info.data and v.strip().lower() == info.data["pickup_location"].strip().lower():
            raise ValueError("Pickup location and destination cannot be identical.")
        return v

class RideRequestResponse(BaseModel):
    request_id: int
    requester_id: int
    request_type: str
    pickup_location: str
    destination: str
    departure_time: datetime
    request_status: str
    created_at: datetime

class MatchSearchRequest(BaseModel):
    pickup_location: str
    destination: str
    departure_time: datetime

# ==========================================
# RIDE GROUP & MEMBERSHIP SCHEMAS
# ==========================================

class RideGroupCreate(BaseModel):
    request_id: int
    departure_time: datetime
    estimated_fare: Optional[float] = None

class GroupMemberResponse(BaseModel):
    membership_id: int
    group_id: int
    user_id: int
    full_name: str
    email: str
    user_role: str
    member_role: str
    membership_status: str
    joined_at: datetime
    confirmation_status: Optional[str] = None
    confirmed_at: Optional[datetime] = None
    share_amount: Optional[float] = None
    payment_status: Optional[str] = None

class RideGroupResponse(BaseModel):
    group_id: int
    request_id: int
    request_type: str
    pickup_location: str
    destination: str
    departure_time: datetime
    group_status: str
    estimated_fare: Optional[float] = None
    actual_fare: Optional[float] = None
    confirmation_deadline: Optional[datetime] = None
    created_at: datetime
    coordinator_id: int
    coordinator_name: str
    coordinator_email: str
    estimated_duration_minutes: Optional[int] = 15
    active_member_count: int
    confirmed_member_count: int
    members: Optional[List[GroupMemberResponse]] = []

class JoinGroupResponse(BaseModel):
    membership_id: int
    group_id: int
    message: str

class CancellationRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500)

# ==========================================
# FARE & PAYMENT SCHEMAS
# ==========================================

class ActualFareInput(BaseModel):
    actual_fare: float = Field(..., gt=0)

class FareAllocationResponse(BaseModel):
    group_id: int
    actual_fare: float
    discrepancy_flag: str
    message: str
    shares: List[Dict[str, Any]]

class PaymentStatusUpdate(BaseModel):
    payment_status: str = Field(..., pattern="^(PAID|FAILED|DISPUTED)$")

# ==========================================
# RATINGS & REVIEWS
# ==========================================

class RatingCreate(BaseModel):
    reviewed_membership_id: int
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = Field(None, max_length=1000)

class RatingResponse(BaseModel):
    rating_id: int
    group_id: int
    reviewer_membership_id: int
    reviewed_membership_id: int
    rating: int
    review_text: Optional[str] = None
    created_at: datetime

# ==========================================
# REPORTS & ADMIN REVIEW
# ==========================================

class ReportCreate(BaseModel):
    group_id: Optional[int] = None
    reported_user_id: Optional[int] = None
    report_reason: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)

class ReportResponse(BaseModel):
    report_id: int
    group_id: Optional[int] = None
    reporter_id: int
    reporter_name: Optional[str] = None
    reported_user_id: Optional[int] = None
    reported_user_name: Optional[str] = None
    report_reason: str
    description: Optional[str] = None
    report_status: str
    admin_outcome_note: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None

class AdminReviewResolve(BaseModel):
    status: str = Field(..., pattern="^(RESOLVED|DISMISSED)$")
    outcome_note: str = Field(..., min_length=5, max_length=1000)

class AdminReviewResponse(BaseModel):
    review_id: int
    review_reason: str
    review_status: str
    created_at: datetime
    group_id: Optional[int] = None
    cancellation_id: Optional[int] = None
    report_id: Optional[int] = None
    assigned_admin_id: Optional[int] = None
    assigned_admin_name: Optional[str] = None
    outcome_note: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    report_reason: Optional[str] = None
    report_description: Optional[str] = None
    reporter_name: Optional[str] = None
    reported_user_name: Optional[str] = None
    cancellation_type: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancelled_by_name: Optional[str] = None

class AdminDashboardStats(BaseModel):
    total_users: int
    active_groups: int
    completed_rides: int
    pending_admin_reviews: int
    total_routes: int

class RouteFareCreateOrUpdate(BaseModel):
    pickup_location: str = Field(..., min_length=2, max_length=200)
    destination: str = Field(..., min_length=2, max_length=200)
    estimated_fare: float = Field(..., ge=0)
    estimated_duration_minutes: Optional[int] = Field(15, gt=0)
    is_active: str = Field("Y", pattern="^(Y|N)$")

# ==========================================
# NOTIFICATIONS
# ==========================================

class NotificationResponse(BaseModel):
    notification_id: int
    user_id: int
    group_id: Optional[int] = None
    notification_type: str
    message: str
    is_read: str
    created_at: datetime
