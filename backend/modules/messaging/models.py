from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from core.database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    message_text = Column(String, nullable=False)
    type = Column(String, default="review") # review, campaign, automation
    status = Column(String, default="sent") # sent, failed
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    message_template = Column(String, nullable=False)
    audience_type = Column(String, nullable=False) # all, inactive, vip
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="draft") # draft, scheduled, completed, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
