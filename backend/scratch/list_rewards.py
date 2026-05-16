import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

from core.database import SessionLocal
from modules.loyalty.models import LoyaltyReward

db = SessionLocal()

rewards = db.query(LoyaltyReward).all()
for r in rewards:
    print(f"Reward: id={r.id}, name={r.name}, required_visits={r.required_visits}, type={r.reward_type}, active={r.is_active}")

db.close()
