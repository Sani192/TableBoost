import re
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal

class VisitCreate(BaseModel):
    phone_number: str
    name: Optional[str] = None
    amount: Decimal
    send_sms: Optional[bool] = None  # Per-visit override; None = use global setting

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        digits = re.sub(r'\D', '', v)
        if len(digits) != 10:
            raise ValueError('Phone number must be exactly 10 digits')
        return digits

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError('Amount must be greater than zero')
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

    class Config:
        from_attributes = True
