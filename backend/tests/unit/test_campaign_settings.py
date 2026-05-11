import pytest
from datetime import datetime, timedelta, timezone
from modules.messaging.service import execute_campaign
from modules.customers.models import Customer
from modules.visits.models import Visit
from modules.settings.service import set_setting

class TestCampaignSettings:
    def test_campaign_uses_global_inactivity_setting(self, db, create_customer):
        # Create two customers
        c1 = create_customer(phone_number="111", name="Active")
        c2 = create_customer(phone_number="222", name="Inactive")
        
        # c1 visited 5 days ago
        db.add(Visit(customer_id=c1.id, amount=10, visited_at=datetime.now(timezone.utc) - timedelta(days=5)))
        # c2 visited 40 days ago
        db.add(Visit(customer_id=c2.id, amount=10, visited_at=datetime.now(timezone.utc) - timedelta(days=40)))
        db.commit()

        # Set global inactivity to 10 days
        set_setting(db, "campaign_inactive_days", 10)
        
        # Execute campaign for inactive customers
        # Should only target c2 (visited 40 days ago > 10 days)
        # c1 (visited 5 days ago < 10 days) is active
        result = execute_campaign(db, "Hi {name}", "inactive")
        
        assert result["total"] == 1
        
        # Now set global inactivity to 60 days
        set_setting(db, "campaign_inactive_days", 60)
        
        # Execute again
        # Now c2 (40 days ago) is NOT inactive (40 < 60)
        result = execute_campaign(db, "Hi {name}", "inactive")
        assert result["total"] == 0

    def test_campaign_fallback_to_30_days(self, db, create_customer):
        c1 = create_customer(phone_number="333", name="Almost Inactive")
        # visited 20 days ago
        db.add(Visit(customer_id=c1.id, amount=10, visited_at=datetime.now(timezone.utc) - timedelta(days=20)))
        db.commit()
        
        # No setting exists, should default to 30
        # 20 < 30, so c1 is active
        result = execute_campaign(db, "Hi {name}", "inactive")
        assert result["total"] == 0
        
        # Set to 15
        set_setting(db, "campaign_inactive_days", 15)
        # 20 > 15, so c1 is inactive
        result = execute_campaign(db, "Hi {name}", "inactive")
        assert result["total"] == 1
