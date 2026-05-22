import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from modules.customers.models import Customer, CustomerProfile
from modules.visits.models import Visit
from modules.intelligence.models import CustomerIntelligence
from modules.loyalty.models import LoyaltyProgress, LoyaltyReward
from modules.customers.service import get_customers

def test_get_customers_is_vip(db: Session):
    # Create customers
    c1 = Customer(phone_number="111", name="C1")
    c2 = Customer(phone_number="222", name="C2")
    c3 = Customer(phone_number="333", name="C3")
    db.add_all([c1, c2, c3])
    db.commit()

    # Create visits so c1 is top spender (10% of 3 is 1)
    db.add(Visit(customer_id=c1.id, amount=1000.0, visited_at=datetime.now(timezone.utc)))
    db.add(Visit(customer_id=c2.id, amount=10.0, visited_at=datetime.now(timezone.utc)))
    db.commit()

    results = get_customers(db, is_vip=True)
    assert len(results) == 1
    assert results[0]["id"] == c1.id

def test_get_customers_is_at_risk(db: Session):
    c1 = Customer(phone_number="111", name="C1")
    db.add(c1)
    db.commit()

    # Create intel where health_status is 'churn_risk'
    # Needs > 1 visits and last visit between 30 and 90 days ago
    forty_days_ago = datetime.now(timezone.utc) - timedelta(days=40)
    eighty_days_ago = datetime.now(timezone.utc) - timedelta(days=80)
    db.add(Visit(customer_id=c1.id, amount=10.0, visited_at=eighty_days_ago))
    db.add(Visit(customer_id=c1.id, amount=10.0, visited_at=forty_days_ago))
    db.add(CustomerIntelligence(customer_id=c1.id, health_status="churn_risk"))
    db.commit()

    results = get_customers(db, is_at_risk=True, has_intel=True)
    assert len(results) == 1
    assert results[0]["id"] == c1.id
