from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RecentVisit(BaseModel):
    customer_id: int
    customer_name: Optional[str] = None
    phone_number: str
    visited_at: datetime
    amount: Optional[float] = None
    health_status: Optional[str] = None
    clv_tier: Optional[str] = None
    total_visits: Optional[int] = None
    total_spent: Optional[float] = None
    last_visit: Optional[datetime] = None

class CelebrationStats(BaseModel):
    birthdays: int
    anniversaries: int

class DailyTrend(BaseModel):
    date: str
    revenue: float
    visits: int

class CampaignROI(BaseModel):
    total_messages: int
    converted_messages: int
    conversion_rate: float
    revenue_generated: float

class RevenueMetrics(BaseModel):
    daily_trends: List[DailyTrend]
    avg_ticket: float
    revenue_split: dict
    weekly_total: float
    monthly_total: float
    repeat_rate: float
    rewards_stats: dict
    campaign_roi: Optional[CampaignROI] = None

class SegmentStats(BaseModel):
    vips_count: int
    at_risk_count: int
    near_rewards_count: int
    lost_count: int
    new_blood_count: int

class DashboardResponse(BaseModel):
    total_customers: int
    total_visits: int
    repeat_customers: int
    total_redeemed: int
    celebrations: CelebrationStats
    recent_visits: List[RecentVisit]
    revenue: Optional[RevenueMetrics] = None
    segments: Optional[SegmentStats] = None
