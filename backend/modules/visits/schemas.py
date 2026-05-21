import re
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date
from decimal import Decimal

from pydantic import BaseModel, field_validator, Field

class VisitCreate(BaseModel):
    phone_number: str = Field(..., max_length=20)
    name: Optional[str] = Field(None, max_length=100)
    amount: Optional[Decimal] = None
    send_sms: Optional[bool] = None  # Per-visit override; None = use global setting
    birthday: Optional[date] = None
    anniversary: Optional[date] = None

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        digits = re.sub(r'\D', '', v)
        if len(digits) != 10:
            raise ValueError('Phone number must be exactly 10 digits')
        return digits

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError('Amount cannot be negative')
        return v

class VisitResponse(BaseModel):
    id: int
    customer_id: int
    amount: Optional[Decimal] = None
    visited_at: datetime
    sms_status: Optional[str] = None

    class Config:
        from_attributes = True

class VisitDetail(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    phone_number: str
    amount: Optional[Decimal] = None
    visited_at: datetime
    sms_status: Optional[str] = None
    health_status: Optional[str] = None
    clv_tier: Optional[str] = None
    spend_trend: Optional[str] = None
    total_visits: Optional[int] = None
    total_spent: Optional[float] = None
    last_visit: Optional[datetime] = None

    class Config:
        from_attributes = True
