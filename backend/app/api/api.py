"""
SynRide Main API Router Aggregator
Combines domain routers under /api.
"""
from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.rides import router as rides_router
from app.api.groups import router as groups_router
from app.api.confirmations import router as confirmations_router
from app.api.fares import router as fares_router
from app.api.ratings import router as ratings_router
from app.api.reports import router as reports_router
from app.api.notifications import router as notifications_router
from app.api.admin import router as admin_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(rides_router)
api_router.include_router(groups_router)
api_router.include_router(confirmations_router)
api_router.include_router(fares_router)
api_router.include_router(ratings_router)
api_router.include_router(reports_router)
api_router.include_router(notifications_router)
api_router.include_router(admin_router)
