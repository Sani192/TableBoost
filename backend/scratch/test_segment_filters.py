import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

from core.database import SessionLocal
from modules.customers.service import get_customers

db = SessionLocal()

print("VIP Customers:")
vips = get_customers(db, is_vip=True)
for v in vips:
    print(f"- {v['name']} (Visits: {v['total_visits']}, Spent: {v['total_spent']})")

print("\nAt-Risk Customers:")
at_risk = get_customers(db, is_at_risk=True)
for v in at_risk:
    print(f"- {v['name']} (Last Visit: {v['last_visit']})")

print("\nReward-Near Customers:")
reward_near = get_customers(db, is_reward_near=True)
for v in reward_near:
    print(f"- {v['name']} (Visits: {v['total_visits']})")

db.close()
