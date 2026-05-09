from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from backend.core.database import Base

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    message_text = Column(String, nullable=False)
    type = Column(String, default="review") # review, campaign
    status = Column(String, default="sent") # sent, failed
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
