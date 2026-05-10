from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RecentVisit(BaseModel):
    customer_name: Optional[str] = None
    phone_number: str
    visited_at: datetime
    amount: Optional[float] = None

class DashboardResponse(BaseModel):
    total_customers: int
    total_visits: int
    repeat_customers: int
    recent_visits: List[RecentVisit]
