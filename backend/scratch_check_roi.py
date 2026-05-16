import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database import SessionLocal
from modules.messaging.models import Message
from modules.visits.models import Visit
from datetime import datetime, timedelta

db = SessionLocal()
thirty_days_ago = datetime.utcnow() - timedelta(days=30)

from modules.customers.models import Customer
customers = db.query(Customer).all()
print(f"Total customers: {len(customers)}")
for c in customers:
    print(f"Customer ID: {c.id}, Created At: {c.created_at}")

# Check Segments calculation
from modules.analytics.service import get_customer_segments
print("Customer Segments:", get_customer_segments(db))

db.close()
