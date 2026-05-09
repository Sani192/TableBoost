"""
Unit tests for backend.modules.visits.schemas

Covers VisitCreate Pydantic validation:
  - Phone number: 10-digit enforcement, non-digit stripping, edge cases
  - Optional fields: name, amount, send_sms defaults
  - VisitResponse: from_attributes serialisation
"""

import pytest
from decimal import Decimal
from pydantic import ValidationError

from backend.modules.visits.schemas import VisitCreate, VisitResponse


# ============================================================================
# Phone number validation
# ============================================================================

class TestPhoneNumberValidation:
    """Tests for the phone_number field_validator."""

    def test_valid_10_digit_phone(self):
        data = VisitCreate(phone_number="5551234567")
        assert data.phone_number == "5551234567"

    def test_phone_with_dashes_stripped(self):
        data = VisitCreate(phone_number="555-123-4567")
        assert data.phone_number == "5551234567"

    def test_phone_with_spaces_stripped(self):
        data = VisitCreate(phone_number="555 123 4567")
        assert data.phone_number == "5551234567"

    def test_phone_with_parentheses_stripped(self):
        data = VisitCreate(phone_number="(555) 123-4567")
        assert data.phone_number == "5551234567"

    def test_phone_with_dots_stripped(self):
        data = VisitCreate(phone_number="555.123.4567")
        assert data.phone_number == "5551234567"

    def test_phone_9_digits_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            VisitCreate(phone_number="555123456")
        assert "10 digits" in str(exc_info.value)

    def test_phone_11_digits_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            VisitCreate(phone_number="15551234567")
        assert "10 digits" in str(exc_info.value)

    def test_phone_empty_string_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            VisitCreate(phone_number="")
        assert "10 digits" in str(exc_info.value)

    def test_phone_all_letters_rejected(self):
        with pytest.raises(ValidationError) as exc_info:
            VisitCreate(phone_number="abcdefghij")
        assert "10 digits" in str(exc_info.value)

    def test_phone_mixed_letters_insufficient_digits(self):
        """Letters are stripped, leaving < 10 digits → rejected."""
        with pytest.raises(ValidationError):
            VisitCreate(phone_number="555abc1234")  # 7 digits after stripping

    def test_phone_missing_field_rejected(self):
        with pytest.raises(ValidationError):
            VisitCreate()  # phone_number is required


# ============================================================================
# Optional field defaults
# ============================================================================

class TestOptionalFieldDefaults:
    """Tests for name, amount, and send_sms default behaviour."""

    def test_name_defaults_to_none(self):
        data = VisitCreate(phone_number="5551234567")
        assert data.name is None

    def test_name_accepted_when_provided(self):
        data = VisitCreate(phone_number="5551234567", name="Alice")
        assert data.name == "Alice"

    def test_amount_defaults_to_none(self):
        data = VisitCreate(phone_number="5551234567")
        assert data.amount is None

    def test_amount_accepted_as_decimal(self):
        data = VisitCreate(phone_number="5551234567", amount=Decimal("45.99"))
        assert data.amount == Decimal("45.99")

    def test_amount_accepted_from_float(self):
        data = VisitCreate(phone_number="5551234567", amount=45.99)
        assert data.amount is not None

    def test_amount_zero_accepted(self):
        data = VisitCreate(phone_number="5551234567", amount=Decimal("0"))
        assert data.amount == Decimal("0")

    def test_amount_negative_rejected(self):
        """As per strategy decision, negative amounts should be rejected."""
        with pytest.raises(ValidationError):
            VisitCreate(phone_number="5551234567", amount=Decimal("-10.00"))

    def test_send_sms_defaults_to_none(self):
        data = VisitCreate(phone_number="5551234567")
        assert data.send_sms is None

    def test_send_sms_true_accepted(self):
        data = VisitCreate(phone_number="5551234567", send_sms=True)
        assert data.send_sms is True

    def test_send_sms_false_accepted(self):
        data = VisitCreate(phone_number="5551234567", send_sms=False)
        assert data.send_sms is False

    def test_all_optional_fields_populated(self):
        data = VisitCreate(
            phone_number="5551234567",
            name="Bob",
            amount=Decimal("100.00"),
            send_sms=True,
        )
        assert data.name == "Bob"
        assert data.amount == Decimal("100.00")
        assert data.send_sms is True


# ============================================================================
# VisitResponse serialisation
# ============================================================================

class TestVisitResponse:
    """Tests for VisitResponse model serialisation."""

    def test_sms_status_defaults_to_none(self):
        from datetime import datetime
        resp = VisitResponse(
            id=1, customer_id=1, amount=None, visited_at=datetime.now()
        )
        assert resp.sms_status is None

    def test_sms_status_accepts_string(self):
        from datetime import datetime
        resp = VisitResponse(
            id=1, customer_id=1, amount=Decimal("10.00"),
            visited_at=datetime.now(), sms_status="sent"
        )
        assert resp.sms_status == "sent"
