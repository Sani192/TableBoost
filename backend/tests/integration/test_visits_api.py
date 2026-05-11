"""
Integration tests for POST /api/visits

Tests the full HTTP stack: TestClient → FastAPI router → service → test DB.
Validates request/response contracts, Pydantic validation error responses,
and end-to-end data persistence.
"""

import pytest
from decimal import Decimal
from unittest.mock import patch

from modules.customers.models import Customer
from modules.visits.models import Visit
from modules.messaging.models import Message


# ============================================================================
# Happy path
# ============================================================================

class TestCreateVisitHappyPath:
    """Successful POST /api/visits/ scenarios."""

    def test_valid_payload_returns_200(self, client):
        response = client.post("/api/visits/", json={
            "phone_number": "5551234567", "amount": 10.00,
            "name": "Alice",
            "amount": 45.99,
            "send_sms": False,
        })

        assert response.status_code == 200

    def test_response_contains_required_fields(self, client):
        response = client.post("/api/visits/", json={
            "phone_number": "5551234567", "amount": 10.00,
            "send_sms": False,
        })

        data = response.json()
        assert "id" in data
        assert "customer_id" in data
        assert "visited_at" in data
        assert "sms_status" in data

    def test_response_sms_status_skipped_when_false(self, client):
        response = client.post("/api/visits/", json={
            "phone_number": "5551234567", "amount": 10.00,
            "send_sms": False,
        })

        assert response.json()["sms_status"] == "skipped"

    @patch("modules.visits.service.messaging_service")
    def test_response_sms_status_sent_when_true(self, mock_msg_svc, client):
        mock_msg_svc.trigger_review_sms.return_value = "sent"

        response = client.post("/api/visits/", json={
            "phone_number": "5551234567", "amount": 10.00,
            "send_sms": True,
        })

        assert response.json()["sms_status"] == "sent"

    def test_amount_preserved_in_response(self, client):
        response = client.post("/api/visits/", json={
            "phone_number": "5551234567", "amount": 10.00,
            "amount": 45.99,
            "send_sms": False,
        })

        data = response.json()
        # Pydantic serialises Decimal — compare as float
        assert float(data["amount"]) == pytest.approx(45.99)

    def test_minimal_payload_phone_only(self, client):
        """Only phone_number is required; everything else optional."""
        response = client.post("/api/visits/", json={
            "phone_number": "5551234567",
        })

        assert response.status_code == 200
        data = response.json()
        assert data["amount"] is None

    def test_creates_customer_and_visit_in_db(self, client, db):
        client.post("/api/visits/", json={
            "phone_number": "5551234567", "amount": 10.00,
            "name": "Alice",
            "send_sms": False,
        })

        assert db.query(Customer).count() == 1
        assert db.query(Visit).count() == 1

    def test_phone_with_formatting_accepted_and_normalised(self, client):
        """Dashes are stripped by the schema validator."""
        response = client.post("/api/visits/", json={
            "phone_number": "555-123-4567", "amount": 10.00,
            "send_sms": False,
        })

        assert response.status_code == 200


# ============================================================================
# Repeat visits (duplicate phone)
# ============================================================================

class TestRepeatVisit:
    """Tests for repeat visits with the same phone number."""

    def test_repeat_visit_returns_same_customer_id(self, client):
        r1 = client.post("/api/visits/", json={
            "phone_number": "5551234567", "amount": 10.00,
            "send_sms": False,
        })
        r2 = client.post("/api/visits/", json={
            "phone_number": "5551234567", "amount": 10.00,
            "send_sms": False,
        })

        assert r1.json()["customer_id"] == r2.json()["customer_id"]

    def test_repeat_visit_creates_second_visit_row(self, client, db):
        client.post("/api/visits/", json={"phone_number": "5551234567", "amount": 10.00, "send_sms": False})
        client.post("/api/visits/", json={"phone_number": "5551234567", "amount": 10.00, "send_sms": False})

        assert db.query(Customer).count() == 1
        assert db.query(Visit).count() == 2

    def test_repeat_visit_different_visit_ids(self, client):
        r1 = client.post("/api/visits/", json={"phone_number": "5551234567", "amount": 10.00, "send_sms": False})
        r2 = client.post("/api/visits/", json={"phone_number": "5551234567", "amount": 10.00, "send_sms": False})

        assert r1.json()["id"] != r2.json()["id"]


# ============================================================================
# Validation errors (422)
# ============================================================================

class TestValidationErrors:
    """Tests for Pydantic/FastAPI 422 responses on bad input."""

    def test_missing_phone_returns_422(self, client):
        response = client.post("/api/visits/", json={})

        assert response.status_code == 422

    def test_phone_9_digits_returns_422(self, client):
        response = client.post("/api/visits/", json={
            "phone_number": "555123456", "amount": 10.00,
        })

        assert response.status_code == 422

    def test_phone_11_digits_returns_422(self, client):
        response = client.post("/api/visits/", json={
            "phone_number": "15551234567", "amount": 10.00,
        })

        assert response.status_code == 422

    def test_phone_letters_only_returns_422(self, client):
        response = client.post("/api/visits/", json={
            "phone_number": "abcdefghij", "amount": 10.00,
        })

        assert response.status_code == 422

    def test_phone_empty_string_returns_422(self, client):
        response = client.post("/api/visits/", json={
            "phone_number": "", "amount": 10.00,
        })

        assert response.status_code == 422

    def test_invalid_body_not_json_returns_422(self, client):
        response = client.post(
            "/api/visits/",
            content="not json",
            headers={"Content-Type": "application/json"},
        )

        assert response.status_code == 422

    def test_422_response_contains_detail(self, client):
        response = client.post("/api/visits/", json={
            "phone_number": "123", "amount": 10.00,
        })

        data = response.json()
        assert "detail" in data


# ============================================================================
# Root endpoint
# ============================================================================

# ============================================================================
# Server Errors (500)
# ============================================================================

class TestServerErrors:
    """Tests for 500 responses when something goes wrong internally."""

    @patch("modules.visits.router.service.add_visit")
    def test_unexpected_error_returns_500(self, mock_add_visit, client):
        mock_add_visit.side_effect = Exception("Database crash")
        
        response = client.post("/api/visits/", json={
            "phone_number": "5551234567", "amount": 10.00,
        })

        assert response.status_code == 500
        assert response.json()["detail"] == "An unexpected error occurred while saving the visit."

class TestRootEndpoint:
    """Sanity check for the root endpoint."""

    def test_root_returns_welcome_message(self, client):
        response = client.get("/")

        assert response.status_code == 200
        assert response.json()["message"] == "Welcome to TableBoost API Phase 1"
