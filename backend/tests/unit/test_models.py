"""
Unit tests for database models.
Validates constraints and basic model behaviour.
"""

import pytest
from sqlalchemy.exc import IntegrityError
from modules.customers.models import Customer
from modules.visits.models import Visit
from modules.messaging.models import Message
from modules.settings.models import Setting

class TestCustomerModel:
    def test_phone_number_unique_constraint(self, db):
        c1 = Customer(phone_number="1234567890")
        db.add(c1)
        db.commit()
        
        c2 = Customer(phone_number="1234567890")
        db.add(c2)
        with pytest.raises(IntegrityError):
            db.commit()

    def test_customer_creation_defaults(self, db):
        c = Customer(phone_number="0987654321")
        db.add(c)
        db.commit()
        db.refresh(c)
        assert c.id is not None
        assert c.created_at is not None
        assert c.name is None

class TestVisitModel:
    def test_visit_foreign_key_constraint(self, db):
        # Visit with non-existent customer_id
        v = Visit(customer_id=999)
        db.add(v)
        with pytest.raises(IntegrityError):
            db.commit()

    def test_visit_creation_defaults(self, db, create_customer):
        c = create_customer(phone_number="1122334455")
        v = Visit(customer_id=c.id)
        db.add(v)
        db.commit()
        db.refresh(v)
        assert v.id is not None
        assert v.visited_at is not None
        assert v.amount is None

class TestMessageModel:
    def test_message_defaults(self, db, create_customer):
        c = create_customer(phone_number="5544332211")
        m = Message(customer_id=c.id, message_text="Hello")
        db.add(m)
        db.commit()
        db.refresh(m)
        assert m.id is not None
        assert m.type == "review"
        assert m.status == "sent"
        assert m.sent_at is not None

class TestSettingModel:
    def test_setting_unique_key(self, db):
        s1 = Setting(key="test_key", value_str="val1")
        db.add(s1)
        db.commit()
        
        s2 = Setting(key="test_key", value_str="val2")
        db.add(s2)
        with pytest.raises(IntegrityError):
            db.commit()
