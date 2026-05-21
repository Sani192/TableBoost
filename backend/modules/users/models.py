from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship, object_session
from core.database import Base
from modules.subscriptions.models import Subscription

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to user (one-to-one)
    user = relationship("User", back_populates="profile", uselist=False)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("user_profiles.id"), unique=True, nullable=True) # Nullable for now to support existing users
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False) # OWNER, MANAGER, STAFF
    is_active = Column(Boolean, default=True)
    token_version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to profile
    profile = relationship("UserProfile", back_populates="user")
    
    # Relationship to subscription (one-to-one)
    subscription = relationship("Subscription", back_populates="user", uselist=False)

    @property
    def plan(self) -> str:
        if self.subscription and self.subscription.status == "ACTIVE":
            return self.subscription.plan.name
            
        # If not the owner, check if the OWNER user has an active subscription
        session = object_session(self)
        if session:
            owner_sub = session.query(Subscription).join(User, Subscription.user_id == User.id).filter(
                User.role == "OWNER",
                Subscription.status == "ACTIVE"
            ).first()
            if owner_sub:
                return owner_sub.plan.name
                
        return "STARTER"

    @property
    def features(self) -> list[str]:
        session = object_session(self)
        if self.subscription and self.subscription.status == "ACTIVE":
            plan = self.subscription.plan
            if plan:
                return [pf.feature.code for pf in plan.features]
                
        # If not owner, check the owner's active subscription features
        if session:
            owner_sub = session.query(Subscription).join(User, Subscription.user_id == User.id).filter(
                User.role == "OWNER",
                Subscription.status == "ACTIVE"
            ).first()
            if owner_sub and owner_sub.plan:
                return [pf.feature.code for pf in owner_sub.plan.features]
        
            # Fallback to STARTER features from database if session is available
            from modules.subscriptions.models import Plan
            starter_plan = session.query(Plan).filter(Plan.name == "STARTER").first()
            if starter_plan:
                return [pf.feature.code for pf in starter_plan.features]
                
        # In-memory hardcoded fallback if session is not available (e.g. before DB is seeded)
        return ["visits", "customers", "review_sms"]
