"""
SynRide Groups & Memberships API Router
Lifecycle of pooling groups, join requests, capacity cap enforcement (max 3),
and coordinator replacement upon cancellation.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.schemas import (
    RideGroupCreate, RideGroupResponse, GroupMemberResponse,
    JoinGroupResponse, CancellationRequest
)
from app.repositories.group_repo import GroupRepository
from app.repositories.ride_repo import RideRepository
from app.api.deps import get_current_user
from app.core.exceptions import EntityNotFoundError, SynRideException, CapacityExceededError

router = APIRouter(prefix="/groups", tags=["Ride Groups"])

@router.post("", response_model=RideGroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    req: RideGroupCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Forms a new pooling group for a ride request.
    The creator automatically becomes the initial coordinator.
    """
    request_data = RideRepository.get_request_by_id(req.request_id)
    if not request_data:
        raise EntityNotFoundError("Ride request not found")

    # Fetch estimated fare from route table if not provided
    est_fare = req.estimated_fare
    if est_fare is None:
        route = RideRepository.get_route_fare(request_data["pickup_location"], request_data["destination"])
        est_fare = route.get("estimated_fare") if route else 250.0

    group_id = GroupRepository.create_group(
        request_id=req.request_id,
        coordinator_id=current_user["user_id"],
        departure_time=req.departure_time,
        estimated_fare=est_fare
    )

    group = GroupRepository.get_group_by_id(group_id)
    group["members"] = GroupRepository.list_group_members(group_id)
    return group

@router.get("", response_model=List[RideGroupResponse])
def list_groups():
    """Lists all active and forming ride groups."""
    groups = GroupRepository.list_active_groups()
    for g in groups:
        g["members"] = GroupRepository.list_group_members(g["group_id"])
    return groups

@router.get("/me", response_model=List[RideGroupResponse])
def get_my_groups(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Lists all ride groups where the authenticated user is an active participant."""
    groups = GroupRepository.list_user_groups(current_user["user_id"])
    for g in groups:
        g["members"] = GroupRepository.list_group_members(g["group_id"])
    return groups

@router.get("/{group_id}", response_model=RideGroupResponse)
def get_group_details(group_id: int):
    """Retrieves full details of a ride group, including all member confirmation and payment statuses."""
    group = GroupRepository.get_group_by_id(group_id)
    if not group:
        raise EntityNotFoundError("Ride group not found")
    group["members"] = GroupRepository.list_group_members(group_id)
    return group

@router.post("/{group_id}/join", response_model=JoinGroupResponse)
def join_group(
    group_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Joins a pending ride group.
    Enforces maximum capacity of 3 members and prevents duplicate active memberships
    via the Oracle JOIN_RIDE_GROUP stored procedure and row locking.
    """
    mem_id = GroupRepository.join_group(group_id, current_user["user_id"])
    return {
        "membership_id": mem_id,
        "group_id": group_id,
        "message": "Successfully joined ride group. Your confirmation is pending."
    }

@router.post("/{group_id}/cancel", status_code=status.HTTP_200_OK)
def cancel_participation(
    group_id: int,
    req: CancellationRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Cancels group participation.
    - Free cancellation up to 60 minutes before departure.
    - Within 60 minutes: flags for administrator review.
    - If coordinator cancels: automatically replaces coordinator with earliest active participant.
    """
    membership = GroupRepository.get_user_active_membership(group_id, current_user["user_id"])
    if not membership:
        raise EntityNotFoundError("Active group membership not found for current user")

    group = GroupRepository.get_group_by_id(group_id)
    if not group:
        raise EntityNotFoundError("Ride group not found")

    is_coordinator = (membership.get("member_role") == "COORDINATOR")
    result = GroupRepository.cancel_membership(
        membership_id=membership["membership_id"],
        group_id=group_id,
        cancelled_by_user_id=current_user["user_id"],
        reason=req.reason,
        is_coordinator=is_coordinator,
        departure_time=group["departure_time"]
    )
    return {
        "message": "Participation cancelled successfully",
        "admin_review_required": result["admin_review_required"],
        "new_coordinator_id": result.get("new_coordinator_id")
    }

@router.post("/{group_id}/complete", status_code=status.HTTP_200_OK)
def complete_ride(
    group_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Marks a confirmed ride group as COMPLETED. Can only be performed by the coordinator."""
    GroupRepository.complete_ride(group_id, current_user["user_id"])
    return {"message": "Ride marked as COMPLETED. Rating window is now open."}
