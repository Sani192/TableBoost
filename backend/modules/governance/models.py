from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from core.database import Base, get_default_restaurant_id

class AuditLog(Base):
    __tablename__ = "gov_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True, index=True, default=get_default_restaurant_id)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    actor_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    actor_username = Column(String, nullable=True, index=True)
    action = Column(String, nullable=False, index=True) # LOGIN, LOGOUT, UPDATE_CUSTOMER, CREATE_REWARD, etc.
    entity_type = Column(String, nullable=True, index=True) # Customer, LoyaltyReward, Visit, User, etc.
    entity_id = Column(String, nullable=True, index=True)
    status = Column(String, nullable=False, index=True) # SUCCESS, FAILED
    metadata_json = Column(JSON, nullable=True)

class OperationalLog(Base):
    __tablename__ = "gov_operational_logs"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True, index=True, default=get_default_restaurant_id)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    log_type = Column(String, nullable=False, index=True) # SCHEDULER, AUTOMATION, CAMPAIGN
    event_name = Column(String, nullable=False, index=True) # JOB_START, JOB_SUCCESS, JOB_FAILURE, etc.
    job_id = Column(String, nullable=True, index=True) # auto_birthday, campaign_job, etc.
    status = Column(String, nullable=False, index=True) # SUCCESS, FAILED, RUNNING
    message = Column(String, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    metadata_json = Column(JSON, nullable=True)
