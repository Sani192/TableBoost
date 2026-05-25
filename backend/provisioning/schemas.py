from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ProvisionRequest(BaseModel):
    restaurant_name: str = Field(..., min_length=2, max_length=100, description="The name of the restaurant to provision")
    timezone: str = Field("UTC", description="The timezone of the restaurant (e.g., America/New_York)")
    owner_username: str = Field(..., min_length=3, max_length=50, description="The unique username for the owner user")
    owner_password: str = Field(..., min_length=6, max_length=128, description="The secure password for the newly created users")
    plan_name: str = Field("PRO", description="The subscription plan to assign (STARTER, GROWTH, PRO, ENTERPRISE_READY)")
    dryRun: bool = Field(False, description="If true, rollback transaction at the end without saving changes")

class ProvisionResponse(BaseModel):
    success: bool
    dryRun: bool
    restaurant_id: Optional[int] = None
    restaurant_name: str
    owner_username: str
    manager_username: str
    staff_username: str
    plan_assigned: str
    actions_taken: List[str]

class ValidateResponse(BaseModel):
    status: str
    restaurant_id: int
    details: Dict[str, Any]
