from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from core.database import Base
from datetime import datetime

class Feature(Base):
    __tablename__ = "sub_features"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)  # visits, loyalty, campaigns, etc.
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    plans = relationship("PlanFeature", back_populates="feature", cascade="all, delete-orphan")

class Plan(Base):
    __tablename__ = "sub_plans"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)  # STARTER, GROWTH, PRO, ENTERPRISE_READY
    tier = Column(Integer, nullable=False)  # 1, 2, 3, 4
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    features = relationship("PlanFeature", back_populates="plan", cascade="all, delete-orphan")

class PlanFeature(Base):
    __tablename__ = "sub_plan_features"

    plan_id = Column(Integer, ForeignKey("sub_plans.id", ondelete="CASCADE"), primary_key=True)
    feature_id = Column(Integer, ForeignKey("sub_features.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    plan = relationship("Plan", back_populates="features")
    feature = relationship("Feature", back_populates="plans")

class Subscription(Base):
    __tablename__ = "sub_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    plan_id = Column(Integer, ForeignKey("sub_plans.id"), nullable=False)
    status = Column(String, nullable=False, default="ACTIVE")  # ACTIVE, EXPIRED, CANCELLED
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="subscription")
    plan = relationship("Plan")
