from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RecentVisit(BaseModel):
    customer_name: Optional[str] = None
    phone_number: str
    visited_at: datetime
    amount: Optional[float] = None

class CelebrationStats(BaseModel):
    birthdays: int
    anniversaries: int

class DailyTrend(BaseModel):
    date: str
    revenue: float
    visits: int

class RevenueMetrics(BaseModel):
    daily_trends: List[DailyTrend]
    avg_ticket: float
    revenue_split: dict
    weekly_total: float
    monthly_total: float
    repeat_rate: float
    rewards_stats: dict

class SegmentStats(BaseModel):
    vips_count: int
    at_risk_count: int
    near_rewards_count: int

class DashboardResponse(BaseModel):
    total_customers: int
    total_visits: int
    repeat_customers: int
    total_redeemed: int
    celebrations: CelebrationStats
    recent_visits: List[RecentVisit]
    revenue: Optional[RevenueMetrics] = None
    segments: Optional[SegmentStats] = None
