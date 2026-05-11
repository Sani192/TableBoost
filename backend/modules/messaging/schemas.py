from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class MessageLogResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    phone_number: str
    message_text: str
    type: str
    status: str
    sent_at: datetime
    
    class Config:
        from_attributes = True

class CampaignCreateRequest(BaseModel):
    message: str = Field(..., min_length=1)
    audience_type: str = Field(..., pattern='^(all|inactive)$')
    inactive_days: Optional[int] = None
