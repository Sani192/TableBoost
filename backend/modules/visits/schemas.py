import re
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal

class VisitCreate(BaseModel):
    phone_number: str
    name: Optional[str] = None
    amount: Optional[Decimal] = None
    send_sms: Optional[bool] = None  # Per-visit override; None = use global setting

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        digits = re.sub(r'\D', '', v)
        if len(digits) != 10:
            raise ValueError('Phone number must be exactly 10 digits')
        return digits

class VisitResponse(BaseModel):
    id: int
    customer_id: int
    amount: Optional[Decimal]
    visited_at: datetime
    sms_status: Optional[str] = None

    class Config:
        from_attributes = True
