from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from core.database import Base, get_default_restaurant_id


class CustomerIntelligence(Base):
    __tablename__ = "customer_intelligence"

    customer_id = Column(Integer, ForeignKey("customers.id"), primary_key=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, default=get_default_restaurant_id)
    clv_score = Column(Float, default=0)
    clv_tier = Column(String(10), default="low")        # high, medium, low
    total_spent = Column(Float, default=0)
    visit_count = Column(Integer, default=0)
    avg_visit_gap_days = Column(Float, nullable=True)
    last_visit_at = Column(DateTime(timezone=True), nullable=True)
    health_status = Column(String(15), default="new")    # healthy, cooling, declining, churn_risk, new
    health_score = Column(Integer, default=100)
    spend_trend = Column(String(10), nullable=True)      # growing, stable, declining
    computed_at = Column(DateTime(timezone=True), server_default=func.now())


class CampaignSummary(Base):
    __tablename__ = "campaign_summaries"

    campaign_id = Column(Integer, ForeignKey("campaigns.id"), primary_key=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, default=get_default_restaurant_id)
    total_sent = Column(Integer, default=0)
    total_converted = Column(Integer, default=0)
    conversion_rate = Column(Float, default=0)
    revenue_attributed = Column(Float, default=0)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())


class RewardSummary(Base):
    __tablename__ = "reward_summaries"

    reward_id = Column(Integer, ForeignKey("loyalty_rewards.id"), primary_key=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, default=get_default_restaurant_id)
    total_redeemed = Column(Integer, default=0)
    eligible_count = Column(Integer, default=0)
    redemption_rate = Column(Float, default=0)
    post_reward_revisit_rate = Column(Float, default=0)
    reward_influenced_revenue = Column(Float, default=0)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())


class AutomationSummary(Base):
    __tablename__ = "automation_summaries"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, default=get_default_restaurant_id)
    automation_type = Column(String(50), nullable=False, index=True)
    period_month = Column(String(7), nullable=False, index=True)     # '2026-05'
    messages_sent = Column(Integer, default=0)
    revisit_count = Column(Integer, default=0)
    revisit_rate = Column(Float, default=0)
    revenue_attributed = Column(Float, default=0)
    computed_at = Column(DateTime(timezone=True), server_default=func.now())


class BusinessSummary(Base):
    __tablename__ = "business_summaries"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, default=get_default_restaurant_id)
    period_type = Column(String(10), nullable=False, index=True)     # weekly, monthly
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    metrics = Column(JSON, nullable=False)
    trends = Column(JSON, nullable=True)
    highlights = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, default=get_default_restaurant_id)
    rule_id = Column(String(10), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(String(10), nullable=False, index=True)        # high, medium, positive
    action_type = Column(String(30), nullable=True)
    action_params = Column(JSON, nullable=True)
    is_dismissed = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
