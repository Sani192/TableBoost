"""
Unit tests for backend.modules.visits.service.add_visit

Covers the core orchestration logic:
  - Customer find-or-create (new, existing, name updates)
  - Visit creation with amount handling
  - SMS decision matrix (per-visit override vs global setting)
  - Transaction atomicity on SMS failure
"""

import pytest
from decimal import Decimal
from unittest.mock import patch, MagicMock

from backend.modules.customers.models import Customer
from backend.modules.visits.models import Visit
from backend.modules.visits.schemas import VisitCreate
from backend.modules.visits.service import add_visit
from backend.modules.messaging.models import Message


# ============================================================================
# Customer find-or-create
# ============================================================================

class TestCustomerFindOrCreate:
    """Tests for step 1 of add_visit: customer lookup / creation."""

    def test_new_customer_created_when_phone_not_in_db(self, db):
        visit_data = VisitCreate(phone_number="5551234567", name="Alice")
        result = add_visit(db, visit_data)

        customer = db.query(Customer).filter(Customer.phone_number == "5551234567").first()
        assert customer is not None
        assert customer.name == "Alice"
        assert result.customer_id == customer.id

    def test_existing_customer_reused_on_repeat_visit(self, db, create_customer):
        existing = create_customer(phone_number="5551234567", name="Alice")

        visit_data = VisitCreate(phone_number="5551234567")
        result = add_visit(db, visit_data)

        assert result.customer_id == existing.id
        # No new customer should have been created
        assert db.query(Customer).count() == 1

    def test_customer_name_updated_when_provided_on_repeat_visit(self, db, create_customer):
        existing = create_customer(phone_number="5551234567", name="Alice")

        visit_data = VisitCreate(phone_number="5551234567", name="Alice Smith")
        add_visit(db, visit_data)

        db.refresh(existing)
        assert existing.name == "Alice Smith"

    def test_customer_name_not_overwritten_when_none_on_repeat_visit(self, db, create_customer):
        existing = create_customer(phone_number="5551234567", name="Alice")

        visit_data = VisitCreate(phone_number="5551234567")  # name=None
        add_visit(db, visit_data)

        db.refresh(existing)
        assert existing.name == "Alice"  # Unchanged

    def test_customer_created_without_name(self, db):
        visit_data = VisitCreate(phone_number="5551234567")
        add_visit(db, visit_data)

        customer = db.query(Customer).first()
        assert customer is not None
        assert customer.name is None

    def test_multiple_customers_for_different_phones(self, db):
        add_visit(db, VisitCreate(phone_number="5551111111", name="Alice"))
        add_visit(db, VisitCreate(phone_number="5552222222", name="Bob"))

        assert db.query(Customer).count() == 2


# ============================================================================
# Visit creation
# ============================================================================

class TestVisitCreation:
    """Tests for step 2 of add_visit: recording the visit."""

    def test_visit_created_with_correct_customer_id(self, db):
        visit_data = VisitCreate(phone_number="5551234567", name="Alice")
        result = add_visit(db, visit_data)

        visit = db.query(Visit).filter(Visit.id == result.id).first()
        assert visit is not None
        assert visit.customer_id == result.customer_id

    def test_visit_amount_stored_as_decimal(self, db):
        visit_data = VisitCreate(phone_number="5551234567", amount=Decimal("45.99"))
        result = add_visit(db, visit_data)

        visit = db.query(Visit).filter(Visit.id == result.id).first()
        assert float(visit.amount) == pytest.approx(45.99)

    def test_visit_amount_none_when_not_provided(self, db):
        visit_data = VisitCreate(phone_number="5551234567")
        result = add_visit(db, visit_data)

        visit = db.query(Visit).filter(Visit.id == result.id).first()
        assert visit.amount is None

    def test_visit_has_visited_at_timestamp(self, db):
        visit_data = VisitCreate(phone_number="5551234567")
        result = add_visit(db, visit_data)

        visit = db.query(Visit).filter(Visit.id == result.id).first()
        assert visit.visited_at is not None

    def test_multiple_visits_same_customer(self, db, create_customer):
        create_customer(phone_number="5551234567")

        add_visit(db, VisitCreate(phone_number="5551234567", amount=Decimal("10")))
        add_visit(db, VisitCreate(phone_number="5551234567", amount=Decimal("20")))

        visits = db.query(Visit).all()
        assert len(visits) == 2


# ============================================================================
# SMS decision matrix
# ============================================================================

class TestSmsDecision:
    """Tests for step 3 of add_visit: SMS send/skip logic."""

    @patch("backend.modules.visits.service.messaging_service")
    def test_send_sms_true_triggers_sms(self, mock_msg_svc, db):
        mock_msg_svc.trigger_review_sms.return_value = "sent"

        visit_data = VisitCreate(phone_number="5551234567", send_sms=True)
        result = add_visit(db, visit_data)

        mock_msg_svc.trigger_review_sms.assert_called_once()
        assert result.sms_status == "sent"

    @patch("backend.modules.visits.service.messaging_service")
    def test_send_sms_false_skips_sms(self, mock_msg_svc, db):
        visit_data = VisitCreate(phone_number="5551234567", send_sms=False)
        result = add_visit(db, visit_data)

        mock_msg_svc.trigger_review_sms.assert_not_called()
        assert result.sms_status == "skipped"

    @patch("backend.modules.visits.service.messaging_service")
    @patch("backend.modules.visits.service.settings_service")
    def test_send_sms_none_falls_back_to_global_true(self, mock_settings, mock_msg_svc, db):
        mock_settings.get_setting.return_value = True
        mock_msg_svc.trigger_review_sms.return_value = "sent"

        visit_data = VisitCreate(phone_number="5551234567")  # send_sms=None
        result = add_visit(db, visit_data)

        mock_settings.get_setting.assert_called_once_with(db, "auto_send_sms", default=True)
        mock_msg_svc.trigger_review_sms.assert_called_once()
        assert result.sms_status == "sent"

    @patch("backend.modules.visits.service.messaging_service")
    @patch("backend.modules.visits.service.settings_service")
    def test_send_sms_none_falls_back_to_global_false(self, mock_settings, mock_msg_svc, db):
        mock_settings.get_setting.return_value = False

        visit_data = VisitCreate(phone_number="5551234567")  # send_sms=None
        result = add_visit(db, visit_data)

        mock_msg_svc.trigger_review_sms.assert_not_called()
        assert result.sms_status == "skipped"

    @patch("backend.modules.visits.service.messaging_service")
    def test_send_sms_true_passes_correct_customer_args(self, mock_msg_svc, db):
        mock_msg_svc.trigger_review_sms.return_value = "sent"

        visit_data = VisitCreate(phone_number="5551234567", name="Alice", send_sms=True)
        add_visit(db, visit_data)

        args = mock_msg_svc.trigger_review_sms.call_args
        assert args[0][1] is not None  # customer_id
        assert args[0][2] == "Alice"   # customer_name


# ============================================================================
# SMS failure → transaction atomicity
# ============================================================================

class TestSmsFailureAtomicity:
    """Verify that SMS failure does NOT roll back the visit or customer."""

    @patch("backend.modules.visits.service.messaging_service")
    def test_sms_failure_returns_failed_status(self, mock_msg_svc, db):
        mock_msg_svc.trigger_review_sms.side_effect = Exception("Gateway down")

        visit_data = VisitCreate(phone_number="5551234567", send_sms=True)
        result = add_visit(db, visit_data)

        assert result.sms_status == "failed"

    @patch("backend.modules.visits.service.messaging_service")
    def test_sms_failure_still_persists_visit(self, mock_msg_svc, db):
        mock_msg_svc.trigger_review_sms.side_effect = Exception("Gateway down")

        visit_data = VisitCreate(phone_number="5551234567", send_sms=True)
        result = add_visit(db, visit_data)

        visit = db.query(Visit).filter(Visit.id == result.id).first()
        assert visit is not None

    @patch("backend.modules.visits.service.messaging_service")
    def test_sms_failure_still_persists_customer(self, mock_msg_svc, db):
        mock_msg_svc.trigger_review_sms.side_effect = Exception("Gateway down")

        visit_data = VisitCreate(phone_number="5551234567", send_sms=True)
        add_visit(db, visit_data)

        customer = db.query(Customer).filter(Customer.phone_number == "5551234567").first()
        assert customer is not None
