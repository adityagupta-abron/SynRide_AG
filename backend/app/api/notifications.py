"""
SynRide Notifications API Router
In-app notification viewing, read acknowledgments, and email delivery preferences.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.models.schemas import NotificationResponse, EmailPreferenceUpdate
from app.repositories.notification_repo import NotificationRepository
from app.api.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_my_notifications(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Retrieves all notifications for the authenticated user."""
    return NotificationRepository.list_user_notifications(current_user["user_id"])

@router.put("/{notification_id}/read", status_code=status.HTTP_200_OK)
def mark_notification_read(
    notification_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Marks an in-app notification as read."""
    NotificationRepository.mark_as_read(notification_id, current_user["user_id"])
    return {"message": "Notification marked as read."}

@router.get("/preferences", status_code=status.HTTP_200_OK)
def get_preferences(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Gets the persistent email notification preference for the user."""
    enabled = NotificationRepository.get_email_preference(current_user["user_id"])
    return {"email_enabled": enabled}

@router.put("/preferences", status_code=status.HTTP_200_OK)
def update_preferences(
    req: EmailPreferenceUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Updates the user's persistent email notification preference."""
    NotificationRepository.update_email_preference(current_user["user_id"], req.email_enabled)
    return {"message": f"Email notifications {'enabled' if req.email_enabled else 'disabled'}."}
