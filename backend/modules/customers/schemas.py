from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

class CustomerBase(BaseModel):
    phone_number: str
    name: Optional[str] = None
    birthday: Optional[date] = None
    anniversary: Optional[date] = None

class CustomerUpdate(BaseModel):
    phone_number: Optional[str] = None
    name: Optional[str] = None
    birthday: Optional[date] = None
    anniversary: Optional[date] = None

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CustomerListResponse(CustomerResponse):
    total_visits: int = 0
    last_visit: Optional[datetime] = None
    total_spent: Optional[Decimal] = None

class VisitMinimal(BaseModel):
    id: int
    amount: Optional[Decimal] = None
    visited_at: datetime

class CustomerDetailResponse(CustomerListResponse):
    pass
