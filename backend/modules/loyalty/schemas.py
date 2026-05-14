from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class LoyaltyRewardBase(BaseModel):
    name: str
    description: Optional[str] = None
    required_visits: int
    reward_type: str = "milestone"
    is_active: bool = True

class LoyaltyRewardCreate(LoyaltyRewardBase):
    pass

class LoyaltyRewardUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    required_visits: Optional[int] = None
    reward_type: Optional[str] = None
    is_active: Optional[bool] = None

class LoyaltyRewardResponse(LoyaltyRewardBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CustomerRewardStatus(BaseModel):
    reward_id: int
    name: str
    description: Optional[str] = None
    required_visits: int
    is_eligible: bool
    is_redeemed: bool

class LoyaltyStatusResponse(BaseModel):
    customer_id: int
    lifetime_visits: int
    rewards: List[CustomerRewardStatus]

class RewardRedemptionResponse(BaseModel):
    id: int
    reward_id: Optional[int] = None
    reward_name: str
    visits_threshold: int
    redeemed_at: datetime

    class Config:
        from_attributes = True
