"""
SynRide Ratings API Router
Post-ride peer reviews (1-5 stars) and reviewer identity masking.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
from app.models.schemas import RatingCreate, RatingResponse
from app.repositories.rating_repo import RatingRepository
from app.repositories.group_repo import GroupRepository
from app.api.deps import get_current_user
from app.core.exceptions import EntityNotFoundError

router = APIRouter(tags=["Ratings"])

@router.post("/groups/{group_id}/ratings", status_code=status.HTTP_201_CREATED)
def submit_rating(
    group_id: int,
    req: RatingCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Submits a 1-5 star rating for a fellow participant post-ride.
    - Allowed only after group status is COMPLETED.
    - Prohibits self-rating.
    - One review per participant pair per group.
    """
    membership = GroupRepository.get_user_active_membership(group_id, current_user["user_id"])
    if not membership:
        raise EntityNotFoundError("Active group membership not found for current user")

    rating_id = RatingRepository.create_rating(
        group_id=group_id,
        reviewer_membership_id=membership["membership_id"],
        reviewed_membership_id=req.reviewed_membership_id,
        rating=req.rating,
        review_text=req.review_text
    )
    return {
        "rating_id": rating_id,
        "message": "Rating submitted successfully. Reviewer identity is protected."
    }

@router.get("/users/{user_id}/ratings", response_model=List[Dict[str, Any]])
def get_user_ratings(
    user_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieves reviews received by a user.
    Reviewer identities are anonymized for ordinary users to protect privacy.
    """
    is_admin = (current_user.get("user_role") == "ADMIN")
    return RatingRepository.get_user_ratings(user_id, is_admin=is_admin)
