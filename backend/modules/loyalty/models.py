from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from core.database import Base

class LoyaltyReward(Base):
    __tablename__ = "loyalty_rewards"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    required_visits = Column(Integer, nullable=False)
    reward_type = Column(String, default="milestone") # milestone, event
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class LoyaltyProgress(Base):
    __tablename__ = "loyalty_progress"

    customer_id = Column(Integer, ForeignKey("customers.id"), primary_key=True)
    lifetime_visits = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class RewardRedemption(Base):
    __tablename__ = "reward_redemptions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    reward_id = Column(Integer, ForeignKey("loyalty_rewards.id"), nullable=True)
    reward_name = Column(String, nullable=False) # Snapshot at time of redemption
    visits_threshold = Column(Integer, nullable=False)
    redeemed_at = Column(DateTime(timezone=True), server_default=func.now())
