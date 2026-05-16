import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

from core.database import SessionLocal
from modules.loyalty.models import LoyaltyReward, LoyaltyProgress

db = SessionLocal()

rewards = db.query(LoyaltyReward).all()
for r in rewards:
    print(f"Reward: id={r.id}, name={r.name}, required_visits={r.required_visits}, type={r.reward_type}, active={r.is_active}")

progress = db.query(LoyaltyProgress).all()
for p in progress:
    print(f"Progress: customer_id={p.customer_id}, lifetime_visits={p.lifetime_visits}")

db.close()
