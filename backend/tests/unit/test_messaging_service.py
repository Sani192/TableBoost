"""
Unit tests for backend.modules.messaging.service

Covers:
  - Template resolution (settings vs default fallback)
  - {name} placeholder substitution
  - Message logging: always persisted regardless of send outcome
  - Status tracking: "sent" vs "failed"
"""

import pytest
from unittest.mock import patch

from backend.modules.messaging.service import trigger_review_sms, DEFAULT_TEMPLATE
from backend.modules.messaging.models import Message
from backend.modules.customers.models import Customer


# ============================================================================
# Template resolution
# ============================================================================

class TestTemplateResolution:
    """Tests for how the SMS template is selected."""

    def test_uses_template_from_settings_when_available(self, db, create_customer, create_setting):
        customer = create_customer(phone_number="5551234567", name="Alice")
        custom_template = "Hey {name}, review us at https://custom.link"
        create_setting(key="review_message_template", value_str=custom_template)

        trigger_review_sms(db, customer.id, customer.name)

        message = db.query(Message).first()
        assert message is not None
        assert "https://custom.link" in message.message_text
        assert "Alice" in message.message_text

    def test_falls_back_to_default_template_when_no_setting(self, db, create_customer):
        customer = create_customer(phone_number="5551234567", name="Alice")

        trigger_review_sms(db, customer.id, customer.name)

        message = db.query(Message).first()
        assert message is not None
        # Default template contains the example review link
        assert "g.page/r/example/review" in message.message_text


# ============================================================================
# Name placeholder substitution
# ============================================================================

class TestNamePlaceholder:
    """Tests for the {name} replacement in the template."""

    def test_name_replaced_when_provided(self, db, create_customer):
        customer = create_customer(phone_number="5551234567", name="Bob")

        trigger_review_sms(db, customer.id, "Bob")

        message = db.query(Message).first()
        assert "Bob" in message.message_text
        assert "{name}" not in message.message_text

    def test_name_replaced_with_there_when_none(self, db, create_customer):
        customer = create_customer(phone_number="5551234567")

        trigger_review_sms(db, customer.id, None)

        message = db.query(Message).first()
        assert "there" in message.message_text
        assert "{name}" not in message.message_text

    def test_name_replaced_with_there_when_empty_string(self, db, create_customer):
        """Empty string is falsy → falls back to 'there'."""
        customer = create_customer(phone_number="5551234567")

        trigger_review_sms(db, customer.id, "")

        message = db.query(Message).first()
        assert "there" in message.message_text


# ============================================================================
# Message logging
# ============================================================================

class TestMessageLogging:
    """Tests for the Message database record creation."""

    def test_message_always_logged_on_success(self, db, create_customer):
        customer = create_customer(phone_number="5551234567", name="Alice")

        trigger_review_sms(db, customer.id, customer.name)

        messages = db.query(Message).all()
        assert len(messages) == 1

    def test_message_type_is_review(self, db, create_customer):
        customer = create_customer(phone_number="5551234567")

        trigger_review_sms(db, customer.id, customer.name)

        message = db.query(Message).first()
        assert message.type == "review"

    def test_message_customer_id_matches_input(self, db, create_customer):
        customer = create_customer(phone_number="5551234567")

        trigger_review_sms(db, customer.id, customer.name)

        message = db.query(Message).first()
        assert message.customer_id == customer.id

    def test_message_text_is_not_empty(self, db, create_customer):
        customer = create_customer(phone_number="5551234567")

        trigger_review_sms(db, customer.id, customer.name)

        message = db.query(Message).first()
        assert message.message_text is not None
        assert len(message.message_text) > 0


# ============================================================================
# Status tracking
# ============================================================================

class TestStatusTracking:
    """Tests for the sent/failed status returned and stored."""

    def test_successful_send_returns_sent(self, db, create_customer):
        customer = create_customer(phone_number="5551234567")

        status = trigger_review_sms(db, customer.id, customer.name)

        assert status == "sent"

    def test_successful_send_stores_sent_in_db(self, db, create_customer):
        customer = create_customer(phone_number="5551234567")

        trigger_review_sms(db, customer.id, customer.name)

        message = db.query(Message).first()
        assert message.status == "sent"

    @patch("backend.modules.messaging.service.print", side_effect=Exception("Gateway timeout"))
    def test_gateway_failure_returns_failed(self, mock_print, db, create_customer):
        """
        The current implementation uses print() as the SMS gateway placeholder.
        Patching at module scope avoids polluting the logging subsystem's
        internal print calls (exc_info traceback formatting uses print).
        """
        customer = create_customer(phone_number="5551234567")

        status = trigger_review_sms(db, customer.id, customer.name)

        assert status == "failed"

    @patch("backend.modules.messaging.service.print", side_effect=Exception("Gateway timeout"))
    def test_gateway_failure_still_logs_message(self, mock_print, db, create_customer):
        """Even on failure, the Message row must be persisted (spec requirement)."""
        customer = create_customer(phone_number="5551234567")

        trigger_review_sms(db, customer.id, customer.name)

        message = db.query(Message).first()
        assert message is not None
        assert message.status == "failed"
