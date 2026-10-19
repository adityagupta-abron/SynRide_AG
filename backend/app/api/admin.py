"""
SynRide Administrator API Router
Administrative dashboards, dispute and cancellation reviews, user audits, and route management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.models.schemas import (
    AdminDashboardStats, AdminReviewResponse, AdminReviewResolve,
    RouteFareCreateOrUpdate, RouteFareResponse
)
from app.repositories.admin_repo import AdminRepository
from app.repositories.ride_repo import RideRepository
from app.api.deps import get_current_admin

router = APIRouter(prefix="/admin", tags=["Administrator Operations"])

@router.get("/dashboard", response_model=AdminDashboardStats)
def get_dashboard_stats(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """Operational summaries and counts for campus administrators."""
    return AdminRepository.get_dashboard_metrics()

@router.get("/reviews", response_model=List[AdminReviewResponse])
def get_review_queue(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """Consolidated review queue of open late cancellations, peer reports, and completion disputes."""
    return AdminRepository.list_review_queue()

@router.post("/reviews/{review_id}/resolve", status_code=status.HTTP_200_OK)
def resolve_admin_review(
    review_id: int,
    req: AdminReviewResolve,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """Resolves an open administrative review with a mandatory audit outcome note."""
    result = AdminRepository.resolve_review(
        review_id=review_id,
        admin_id=current_admin["user_id"],
        status=req.status,
        outcome_note=req.outcome_note
    )
    return {
        "message": f"Review {review_id} resolved as {req.status}",
        "review": result
    }

@router.get("/routes", response_model=List[RouteFareResponse])
def list_all_routes(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """Lists all configured campus routes."""
    return RideRepository.list_route_fares()

@router.post("/routes", status_code=status.HTTP_200_OK)
def create_or_update_route(
    req: RouteFareCreateOrUpdate,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """Creates or updates a maintained route-fare and estimated duration."""
    route = AdminRepository.upsert_route_fare(
        pickup=req.pickup_location,
        dest=req.destination,
        fare=req.estimated_fare,
        duration=req.estimated_duration_minutes or 15,
        is_active=req.is_active
    )
    return {
        "message": "Route fare successfully saved.",
        "route": route
    }

@router.get("/users", response_model=List[Dict[str, Any]])
def list_all_users(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """Lists all registered campus users with student/faculty specialization details."""
    return AdminRepository.list_all_users()
