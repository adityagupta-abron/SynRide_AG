"""
SynRide Confirmations API Router
Handles deadline setting, member confirmations, explicit refusals, and expiry.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any
from app.repositories.confirmation_repo import ConfirmationRepository
from app.repositories.group_repo import GroupRepository
from app.api.deps import get_current_user
from app.core.exceptions import EntityNotFoundError, AuthorizationError

router = APIRouter(tags=["Confirmations"])

@router.post("/groups/{group_id}/deadline", status_code=status.HTTP_200_OK)
def set_group_deadline(
    group_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Sets a 10-minute confirmation deadline for a pending ride group.
    Only the ride coordinator may trigger the confirmation window.
    """
    group = GroupRepository.get_group_by_id(group_id)
    if not group:
        raise EntityNotFoundError("Ride group not found")
    if group["coordinator_id"] != current_user["user_id"]:
        raise AuthorizationError("Only the ride coordinator can initiate the confirmation window")

    ConfirmationRepository.set_confirmation_deadline(group_id)
    return {"message": "Confirmation deadline set to 10 minutes from now."}

@router.post("/confirmations/{membership_id}/confirm", status_code=status.HTTP_200_OK)
def confirm_participation(
    membership_id: int,
    group_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Records a participant's explicit confirmation.
    If all active participants have confirmed, automatically transitions the group to CONFIRMED.
    """
    result = ConfirmationRepository.record_confirmation(membership_id, group_id)
    msg = "Participation confirmed."
    if result["group_confirmed"]:
        msg += " All active members have confirmed. The ride group is now CONFIRMED!"
    return {
        "message": msg,
        "details": result
    }

@router.post("/confirmations/{membership_id}/decline", status_code=status.HTTP_200_OK)
def decline_participation(
    membership_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Declines participation in the ride group.
    Does not immediately expire the group; waits for the confirmation deadline.
    """
    ConfirmationRepository.decline_confirmation(membership_id)
    return {"message": "Participation declined."}

@router.post("/groups/{group_id}/expire", status_code=status.HTTP_200_OK)
def expire_unconfirmed_group(
    group_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Expires a pending group if its confirmation deadline has passed."""
    ConfirmationRepository.expire_unconfirmed_group(group_id)
    return {"message": "Group expired successfully due to elapsed confirmation deadline."}
