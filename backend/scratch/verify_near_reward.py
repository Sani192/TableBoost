import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

from core.database import SessionLocal
from modules.loyalty.models import LoyaltyProgress, LoyaltyReward
from modules.analytics.service import get_customer_segments

db = SessionLocal()

# Add a customer with 3 visits (Near 5 visits milestone)
# Assuming customer_id 10 has 1 visit
p = db.query(LoyaltyProgress).filter(LoyaltyProgress.customer_id == 10).first()
if p:
    original_visits = p.lifetime_visits
    p.lifetime_visits = 3
    db.commit()
    
    segments = get_customer_segments(db)
    print(f"Near Reward Count (with 3 visits): {segments['near_rewards_count']}")
    
    # Restore
    p.lifetime_visits = original_visits
    db.commit()
else:
    print("Customer 10 not found")

db.close()
