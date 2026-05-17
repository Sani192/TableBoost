import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from modules.dashboard.service import get_dashboard_stats
from core.database import SessionLocal

db = SessionLocal()
try:
    res = get_dashboard_stats(db)
    print("Dashboard stats fetched successfully!")
    print("Recent visits count:", len(res["recent_visits"]))
    if res["recent_visits"]:
        print("First visit sample:", res["recent_visits"][0])
except Exception as e:
    print("Error:", e)
finally:
    db.close()
