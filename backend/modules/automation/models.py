from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.sql import func
from core.database import Base, get_default_restaurant_id

class AutomationConfig(Base):
    __tablename__ = "automation_configs"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, default=get_default_restaurant_id)
    automation_type = Column(String, nullable=False) # birthday, anniversary, inactivity, reward_unlocked, campaign_scheduler
    is_enabled = Column(Boolean, default=False)
    message_template = Column(String, nullable=False)
    schedule = Column(String, nullable=True) # e.g. "cron:09:00", "interval:1"
    settings = Column(JSON, nullable=True) # e.g. {"days": 30} for inactivity
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AutomationHistory(Base):
    __tablename__ = "automation_history"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, default=get_default_restaurant_id)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    automation_type = Column(String, nullable=False)
    reference_period = Column(String, nullable=True) # e.g. "2024" for birthday, "visit_10" for rewards
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
