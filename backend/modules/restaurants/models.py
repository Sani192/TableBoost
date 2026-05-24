from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from core.database import Base

class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    timezone = Column(String, default="UTC", nullable=False)
    owner_details = Column(JSON, nullable=True) # Extensible structure for owners
    restaurant_details = Column(JSON, nullable=True) # Extensible location data
    status = Column(String, default="ACTIVE") # ACTIVE, SUSPENDED, CHURNED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    users = relationship("RestaurantUser", back_populates="restaurant", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="restaurant", uselist=False)

class RestaurantUser(Base):
    __tablename__ = "restaurant_users"

    __table_args__ = (
        UniqueConstraint('restaurant_id', 'user_id', name='uix_restaurant_user'),
    )

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    restaurant = relationship("Restaurant", back_populates="users")
    user = relationship("User", back_populates="restaurant_links")
