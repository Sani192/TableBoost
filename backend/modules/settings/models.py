from sqlalchemy import Column, Integer, Boolean, String, ForeignKey, UniqueConstraint
from core.database import Base, get_default_restaurant_id

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False, index=True, default=get_default_restaurant_id)
    key = Column(String, index=True)
    value_bool = Column(Boolean, nullable=True)
    value_str = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint('restaurant_id', 'key', name='uix_restaurant_key'),
    )
