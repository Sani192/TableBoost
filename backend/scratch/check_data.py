import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

from core.database import SessionLocal
from modules.customers.models import Customer
from modules.visits.models import Visit
from modules.loyalty.models import LoyaltyProgress, LoyaltyReward, RewardRedemption

db = SessionLocal()

print(f"Customers: {db.query(Customer).count()}")
print(f"Visits: {db.query(Visit).count()}")
print(f"LoyaltyProgress: {db.query(LoyaltyProgress).count()}")
print(f"LoyaltyRewards: {db.query(LoyaltyReward).count()}")
print(f"Redemptions: {db.query(RewardRedemption).count()}")

# Sample visits
visits = db.query(Visit).limit(5).all()
for v in visits:
    print(f"Visit: id={v.id}, customer_id={v.customer_id}, amount={v.amount}, visited_at={v.visited_at}")

db.close()
