"""
SynRide Pytest Configuration & Test Fixtures
Provides FastAPI TestClient, isolated test credentials, and mock/live database helpers.
"""
import pytest
import sys
import os
from fastapi.testclient import TestClient

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.core.security import create_access_token

@pytest.fixture(scope="session")
def client():
    """Provides a TestClient instance for the FastAPI application."""
    with TestClient(app) as c:
        yield c

@pytest.fixture
def student_auth_headers():
    """Provides valid JWT authorization headers for a test student user."""
    token = create_access_token({"sub": "2", "role": "STUDENT"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def coordinator_auth_headers():
    """Provides valid JWT authorization headers for test coordinator (User 1)."""
    token = create_access_token({"sub": "1", "role": "STUDENT"})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_auth_headers():
    """Provides valid JWT authorization headers for the administrator (User 22)."""
    token = create_access_token({"sub": "22", "role": "ADMIN"})
    return {"Authorization": f"Bearer {token}"}
