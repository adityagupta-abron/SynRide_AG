"""
SynRide Fares & Payments API Router
Actual fare recording, exact individual share calculation with remainder allocated to coordinator,
and simulated payment tracking (PENDING, PAID, FAILED, DISPUTED).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from app.models.schemas import ActualFareInput, FareAllocationResponse, PaymentStatusUpdate
from app.repositories.fare_repo import FareRepository
from app.repositories.group_repo import GroupRepository
from app.api.deps import get_current_user
from app.core.exceptions import EntityNotFoundError, AuthorizationError

router = APIRouter(tags=["Fares & Payments"])

@router.post("/groups/{group_id}/fare", response_model=FareAllocationResponse)
def record_actual_fare(
    group_id: int,
    req: ActualFareInput,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Coordinator enters the actual fare agreed with the driver.
    - Calculates exact equal individual shares.
    - Allocates any integer/cents rounding remainder to the coordinator.
    - Checks for >25% discrepancy against the estimated route fare.
    """
    group = GroupRepository.get_group_by_id(group_id)
    if not group:
        raise EntityNotFoundError("Ride group not found")
    if group["coordinator_id"] != current_user["user_id"]:
        raise AuthorizationError("Only the ride coordinator can record the actual fare")

    result = FareRepository.calculate_and_allocate_fare(group_id, req.actual_fare)
    return result

@router.get("/groups/{group_id}/fare", response_model=List[Dict[str, Any]])
def get_group_fare_breakdown(
    group_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieves the individual fare share breakdown and payment statuses for a group."""
    return FareRepository.get_fare_shares(group_id)

@router.put("/fares/{membership_id}/payment", status_code=status.HTTP_200_OK)
def update_payment_status(
    membership_id: int,
    req: PaymentStatusUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Simulated Payment Workflow:
    Updates payment status (PAID, FAILED, DISPUTED) for a participant's fare share.
    """
    updated = FareRepository.update_payment_status(membership_id, req.payment_status)
    return {
        "message": f"Payment status updated to {req.payment_status}",
        "fare_share": updated
    }
