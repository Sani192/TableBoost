from sqlalchemy import Column, Integer, Boolean, String
from core.database import Base

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value_bool = Column(Boolean, nullable=True)
    value_str = Column(String, nullable=True)
