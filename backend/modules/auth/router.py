from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from core.database import get_db
from modules.users.service import get_user_by_username, verify_password
from modules.users.schemas import UserResponse, UserProfileResponse, UserProfileUpdate
from .service import create_access_token, decode_access_token
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(login_data: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = get_user_by_username(db, login_data.username)
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role})
    
    # Set HTTP-only cookie
    response.set_cookie(
        key="tableboost_token",
        value=access_token,
        httponly=True,
        max_age=1440 * 60, # 24 hours
        expires=1440 * 60,
        samesite="lax",
        secure=False, # Set to True in production with HTTPS
        path="/",
    )
    
    return {
        "message": "Login successful",
        "role": user.role,
        "username": user.username,
        "plan": user.plan,
        "features": user.features
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("tableboost_token", path="/")
    return {"message": "Logout successful"}

# Dependency to get current user
def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get("tableboost_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    
    username = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
        
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user

@router.get("/me", response_model=UserResponse)
def get_me(current_user = Depends(get_current_user)):
    return current_user

@router.get("/profile", response_model=UserProfileResponse)
def get_profile(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    from modules.users.models import UserProfile
    
    if current_user.profile_id is None:
        # Create profile and link it to user
        profile = UserProfile()
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
        current_user.profile_id = profile.id
        db.commit()
        return profile
        
    profile = db.query(UserProfile).filter(UserProfile.id == current_user.profile_id).first()
    
    if not profile:
        # This shouldn't happen if profile_id is set, but just in case
        profile = UserProfile(id=current_user.profile_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
    return profile

@router.put("/profile", response_model=UserProfileResponse)
def update_profile(profile_data: UserProfileUpdate, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    from modules.users.models import UserProfile
    
    profile = db.query(UserProfile).filter(UserProfile.id == current_user.profile_id).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )
        
    if profile_data.first_name is not None:
        profile.first_name = profile_data.first_name
    if profile_data.last_name is not None:
        profile.last_name = profile_data.last_name
        
    db.commit()
    db.refresh(profile)
    
    return profile

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
def change_password(data: ChangePasswordRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )
    
    from modules.users.service import get_password_hash
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

# Role checker dependency factory
def check_role(allowed_roles: list):
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this resource",
            )
        return current_user
    return role_checker

def check_feature(feature_name: str):
    from modules.subscriptions.registry import has_feature_access_db
    def feature_checker(current_user = Depends(get_current_user), db: Session = Depends(get_db)):
        plan_name = current_user.plan
        if not has_feature_access_db(db, plan_name, feature_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Feature '{feature_name}' requires a higher subscription plan.",
            )
        return current_user
    return feature_checker

class UpgradeSubscriptionRequest(BaseModel):
    plan_name: str

@router.post("/subscription", response_model=UserResponse)
def update_subscription(
    req: UpgradeSubscriptionRequest, 
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    from modules.subscriptions.models import Subscription, Plan
    
    plan = db.query(Plan).filter(Plan.name == req.plan_name).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    sub = db.query(Subscription).filter(Subscription.user_id == current_user.id).first()
    if not sub:
        sub = Subscription(user_id=current_user.id, plan_id=plan.id, status="ACTIVE")
        db.add(sub)
    else:
        sub.plan_id = plan.id
        sub.status = "ACTIVE"
        
    db.commit()
    db.refresh(sub)
    db.refresh(current_user)
    
    return current_user
