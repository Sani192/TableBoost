from sqlalchemy import Column, Integer, String, DateTime, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.database import Base, get_default_restaurant_id

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, default=get_default_restaurant_id)
    phone_number = Column(String, index=True, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('restaurant_id', 'phone_number', name='uix_restaurant_phone'),
    )
    
    profile = relationship("CustomerProfile", back_populates="customer", uselist=False, cascade="all, delete-orphan")

class CustomerProfile(Base):
    __tablename__ = "customer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, default=get_default_restaurant_id)
    customer_id = Column(Integer, ForeignKey("customers.id"), unique=True, nullable=False)
    birthday = Column(Date, nullable=True)
    anniversary = Column(Date, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="profile")
