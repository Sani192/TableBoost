import pytest
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from modules.intelligence import service as intel_service
from modules.customers.models import Customer
from modules.visits.models import Visit
from modules.intelligence.models import CustomerIntelligence

def test_compute_daily_intelligence(db: Session, create_customer):
    # Create a customer
    cust = create_customer(phone_number="1234567890", name="Test User")
    
    # Create visits
    now = datetime.now(timezone.utc)
    v1 = Visit(customer_id=cust.id, amount=100.0, visited_at=now - timedelta(days=10))
    v2 = Visit(customer_id=cust.id, amount=100.0, visited_at=now - timedelta(days=5))
    v3 = Visit(customer_id=cust.id, amount=100.0, visited_at=now)
    db.add_all([v1, v2, v3])
    db.commit()
    
    # Run computation
    intel_service.compute_daily_intelligence(db)
    
    # Verify
    intel = db.query(CustomerIntelligence).filter(CustomerIntelligence.customer_id == cust.id).first()
    assert intel is not None
    assert intel.visit_count == 3
    assert intel.total_spent == 300.0
    assert intel.health_status == "healthy"

from modules.intelligence.models import Recommendation

def test_evaluate_recommendations(db: Session, create_customer):
    # Create a declining VIP customer to trigger R1
    cust = create_customer(phone_number="1111111111", name="VIP User")
    intel = CustomerIntelligence(
        customer_id=cust.id,
        clv_tier="high",
        health_status="declining",
        computed_at=datetime.now(timezone.utc)
    )
    db.add(intel)
    db.commit()
    
    # Run evaluation
    count = intel_service.evaluate_recommendations(db)
    
    # Verify
    assert count > 0
    recs = db.query(Recommendation).filter(Recommendation.is_dismissed == False).all()
    assert len(recs) > 0
    assert any(r.rule_id == "R1" for r in recs)
