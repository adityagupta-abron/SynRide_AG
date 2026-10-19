"""
SynRide Reports API Router
Incident reporting, coordinator completion disputes, and administrative resolution.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.models.schemas import ReportCreate, ReportResponse, AdminReviewResolve
from app.repositories.report_repo import ReportRepository
from app.api.deps import get_current_user, get_current_admin
from app.core.exceptions import EntityNotFoundError

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("", status_code=status.HTTP_201_CREATED)
def submit_report(
    req: ReportCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Submits an incident or dispute report.
    Automatically enqueues the incident into ADMIN_REVIEW for administrator action.
    """
    report_id = ReportRepository.create_report(
        reporter_id=current_user["user_id"],
        report_reason=req.report_reason,
        group_id=req.group_id,
        reported_user_id=req.reported_user_id,
        description=req.description
    )
    return {
        "report_id": report_id,
        "message": "Report logged and submitted to the administrator review queue."
    }

@router.get("", response_model=List[Dict[str, Any]])
def list_reports(current_admin: Dict[str, Any] = Depends(get_current_admin)):
    """Administrator access to list all reported incidents."""
    return ReportRepository.list_reports()

@router.post("/{report_id}/resolve", status_code=status.HTTP_200_OK)
def resolve_report(
    report_id: int,
    req: AdminReviewResolve,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """
    Resolves or dismisses an incident report.
    An administrative outcome note is strictly mandatory and audited.
    """
    result = ReportRepository.resolve_report(
        report_id=report_id,
        admin_id=current_admin["user_id"],
        status=req.status,
        outcome_note=req.outcome_note
    )
    return {
        "message": f"Report marked as {req.status} with recorded outcome note.",
        "report": result
    }
