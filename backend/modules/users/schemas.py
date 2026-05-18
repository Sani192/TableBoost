from pydantic import BaseModel
from datetime import datetime

class UserBase(BaseModel):
    username: str
    role: str
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserProfileBase(BaseModel):
    first_name: str | None = None
    last_name: str | None = None

class UserProfileUpdate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
