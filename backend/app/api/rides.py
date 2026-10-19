"""
SynRide Rides & Routes API Router
Creation of ride requests, predefined route fare lookups, and ±15 minute ride matching.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.models.schemas import (
    RouteFareResponse, RideRequestCreate, RideRequestResponse,
    MatchSearchRequest
)
from app.repositories.ride_repo import RideRepository
from app.api.deps import get_current_user
from app.core.exceptions import OverlappingRideError, SynRideException

router = APIRouter(prefix="/rides", tags=["Rides & Routes"])

@router.get("/routes", response_model=List[RouteFareResponse])
def get_active_routes():
    """Retrieves all active maintained campus and city routes with estimated fares and durations."""
    return RideRepository.list_route_fares()

@router.post("/requests", response_model=RideRequestResponse, status_code=status.HTTP_201_CREATED)
def create_ride_request(
    req: RideRequestCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Submits a new ride request (LOOKING_FOR_COMPANIONS or VEHICLE_ARRANGED).
    Checks route duration and prevents overlapping trips.
    """
    route = RideRepository.get_route_fare(req.pickup_location, req.destination)
    duration_mins = route.get("estimated_duration_minutes", 15) if route else 15

    # Check overlapping confirmed or forming trips
    has_overlap = RideRepository.check_overlapping_rides(
        user_id=current_user["user_id"],
        departure_time=req.departure_time,
        duration_minutes=duration_mins
    )
    if has_overlap:
        raise OverlappingRideError("You already have an active or pending ride scheduled around this time.")

    request_id = RideRepository.create_ride_request(
        requester_id=current_user["user_id"],
        request_type=req.request_type,
        pickup_location=req.pickup_location,
        destination=req.destination,
        departure_time=req.departure_time
    )

    created = RideRepository.get_request_by_id(request_id)
    return created

@router.get("/requests/me", response_model=List[RideRequestResponse])
def get_my_requests(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieves all ride requests created by the current user."""
    return RideRepository.list_user_requests(current_user["user_id"])

@router.post("/match", response_model=List[Dict[str, Any]])
def find_matching_rides(
    req: MatchSearchRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Matching Algorithm:
    Matches users travelling along the same route (same pickup, same destination)
    with departure times within +-15 minutes.
    """
    matches = RideRepository.find_matches(
        pickup_location=req.pickup_location,
        destination=req.destination,
        departure_time=req.departure_time,
        exclude_user_id=current_user["user_id"],
        window_minutes=15
    )
    return matches
