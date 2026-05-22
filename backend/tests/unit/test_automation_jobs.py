import pytest
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from modules.customers.models import Customer, CustomerProfile
from modules.visits.models import Visit
from modules.messaging.models import Message
from modules.messaging.service import execute_campaign
from modules.settings.service import set_setting

def test_execute_campaign_inactive(db: Session):
    # Set inactive days to 30
    set_setting(db, "campaign_inactive_days", "30", "integer")

    c1 = Customer(phone_number="111", name="C1")
    c2 = Customer(phone_number="222", name="C2")
    db.add_all([c1, c2])
    db.commit()

    forty_days_ago = datetime.now(timezone.utc) - timedelta(days=40)
    ten_days_ago = datetime.now(timezone.utc) - timedelta(days=10)
    
    # c1 is inactive (last visit 40 days ago)
    db.add(Visit(customer_id=c1.id, amount=10.0, visited_at=forty_days_ago))
    # c2 is active (last visit 10 days ago)
    db.add(Visit(customer_id=c2.id, amount=10.0, visited_at=ten_days_ago))
    db.commit()

    result = execute_campaign(db, message_template="Miss you {name}", audience_type="inactive")
    assert result["sent_count"] == 1
    assert result["failed_count"] == 0

    # Verify message sent to c1
    msg = db.query(Message).filter(Message.customer_id == c1.id).first()
    assert msg is not None
    assert "Miss you C1" in msg.message_text
