"""
SynRide FastAPI Application Entrypoint
Provides CORS configuration, life cycle handlers, centralized error mapping,
and OpenAPI documentation for the SynRide campus ride-pooling system.
"""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

from app.core.config import settings
from app.core.exceptions import SynRideException
from app.db.connection import init_db_pool, close_db_pool
from app.api.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("synride.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Oracle connection pool
    logger.info("Starting up %s in %s mode...", settings.APP_NAME, settings.APP_ENV)
    try:
        init_db_pool()
    except Exception as e:
        logger.error("Oracle pool initialization deferred: %s", e)
    yield
    # Shutdown: Cleanly close Oracle connection pool
    logger.info("Shutting down %s...", settings.APP_NAME)
    close_db_pool()

app = FastAPI(
    title=settings.APP_NAME,
    description="Campus ride-pooling coordination platform for VIT Vellore students and faculty/staff.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list + ["*"] if settings.APP_ENV == "development" else settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global SynRide Domain Exception Handler
@app.exception_handler(SynRideException)
async def synride_exception_handler(request: Request, exc: SynRideException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.error_code,
            "message": exc.message,
            "detail": exc.message
        }
    )

# Health Check Endpoint
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database": "Oracle AI Database 26ai Free"
    }

# Include API Router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)
