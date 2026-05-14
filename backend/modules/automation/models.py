from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.sql import func
from core.database import Base

class AutomationConfig(Base):
    __tablename__ = "automation_configs"

    id = Column(Integer, primary_key=True, index=True)
    automation_type = Column(String, unique=True, nullable=False) # birthday, anniversary, inactivity, reward_unlocked
    is_enabled = Column(Boolean, default=False)
    message_template = Column(String, nullable=False)
    settings = Column(JSON, nullable=True) # e.g. {"days": 30} for inactivity
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class AutomationHistory(Base):
    __tablename__ = "automation_history"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    automation_type = Column(String, nullable=False)
    reference_period = Column(String, nullable=True) # e.g. "2024" for birthday, "visit_10" for rewards
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
