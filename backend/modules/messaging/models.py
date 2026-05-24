from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from core.database import Base, get_default_restaurant_id

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, default=get_default_restaurant_id)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    message_text = Column(String, nullable=False)
    type = Column(String, default="review") # review, campaign, automation
    status = Column(String, default="sent") # sent, failed
    sent_at = Column(DateTime(timezone=True), server_default=func.now())

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, default=get_default_restaurant_id)
    name = Column(String, nullable=False)
    message_template = Column(String, nullable=False)
    audience_type = Column(String, nullable=False) # all, inactive, vip
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="draft") # draft, scheduled, completed, cancelled
    created_at = Column(DateTime(timezone=True), server_default=func.now())
