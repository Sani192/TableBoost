import pytest
from fastapi.testclient import TestClient
from main import app
from modules.auth.router import get_current_user
from modules.users.models import User
from modules.restaurants.models import RestaurantUser

def test_correlation_id_middleware(client):
    # Request standard endpoint
    response = client.get("/")
    assert response.status_code == 200
    # X-Correlation-ID should be generated and returned in headers
    assert "X-Correlation-ID" in response.headers
    correlation_id = response.headers["X-Correlation-ID"]
    assert len(correlation_id) > 0

def test_unified_validation_error_handler(client):
    # Request endpoint with invalid body format to trigger validation error
    response = client.post("/api/visits/", json={
        "phone_number": "invalid_phone",  # should trigger validation if schema enforces length or format
        "amount": "not_a_number"          # invalid numeric format
    })
    assert response.status_code == 422
    data = response.json()
    # Should follow standard TableBoost format
    assert data["error"] is True
    assert "correlation_id" in data
    assert data["type"] == "ValidationError"
    assert "Validation failed" in data["message"]

def test_unified_http_exception_handler(client):
    # Request a non-existent endpoint to trigger a 404 HTTPException
    response = client.get("/api/invalid-endpoint-path-for-testing")
    assert response.status_code == 404
    data = response.json()
    # Should follow standard TableBoost format
    assert data["error"] is True
    assert "correlation_id" in data
    assert data["type"] == "HTTPException"
    assert data["message"] == "Not Found"

def test_tenant_context_fallback_without_header(client, db):
    # Ensure testowner is linked to restaurant 1
    # Check that calling /api/auth/me resolves the tenant context fallback cleanly
    # Override get_current_user to return testowner
    test_user = db.query(User).filter(User.username == "testowner").first()
    assert test_user is not None

    from modules.auth.router import get_current_user
    app.dependency_overrides[get_current_user] = lambda: test_user
    
    # Make request without X-Restaurant-ID header
    response = client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert data["restaurant_id"] == 1  # Resolves fallback from mappings table successfully
    assert data["role"] == "OWNER"
    
    app.dependency_overrides.pop(get_current_user, None)
