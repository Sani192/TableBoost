from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from core.database import get_db
from modules.users.service import get_user_by_username, verify_password
from modules.users.schemas import UserResponse, UserProfileResponse, UserProfileUpdate
from .service import create_access_token, decode_access_token
from pydantic import BaseModel
from modules.governance.service import log_audit_event

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    username: str
    password: str

import time
from collections import defaultdict

# Simple in-memory rate limiter for login brute-force protection
login_attempts = defaultdict(list)
MAX_LOGIN_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 300 # 5 minutes

@router.post("/login")
def login(login_data: LoginRequest, response: Response, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # Clean up old attempts
    login_attempts[ip] = [t for t in login_attempts[ip] if current_time - t < LOGIN_WINDOW_SECONDS]
    
    if len(login_attempts[ip]) >= MAX_LOGIN_ATTEMPTS:
        log_audit_event(
            db,
            actor_id=None,
            actor_username=login_data.username,
            action="LOGIN",
            entity_type="User",
            entity_id=None,
            status="FAILED",
            metadata_json={"ip": ip, "reason": "Rate limited due to too many attempts"}
        )
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later.",
        )

    user = get_user_by_username(db, login_data.username)
    if not user or not verify_password(login_data.password, user.password_hash):
        login_attempts[ip].append(current_time)
        log_audit_event(
            db,
            actor_id=None,
            actor_username=login_data.username,
            action="LOGIN",
            entity_type="User",
            entity_id=None,
            status="FAILED",
            metadata_json={"ip": ip, "reason": "Invalid credentials"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    
    if not user.is_active:
        log_audit_event(
            db,
            actor_id=user.id,
            actor_username=user.username,
            action="LOGIN",
            entity_type="User",
            entity_id=str(user.id),
            status="FAILED",
            metadata_json={"ip": request.client.host if request.client else None, "reason": "User account is inactive"}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive",
        )
    
    access_token = create_access_token(data={"sub": user.username, "role": user.role, "version": user.token_version})
    
    import os
    is_production = os.getenv("ENVIRONMENT", "development") == "production"

    # Set HTTP-only cookie
    response.set_cookie(
        key="tableboost_token",
        value=access_token,
        httponly=True,
        max_age=1440 * 60, # 24 hours
        expires=1440 * 60,
        samesite="lax",
        secure=is_production, # True in production with HTTPS
        path="/",
    )
    
    # Clear failed attempts on success
    if ip in login_attempts:
        del login_attempts[ip]
        
    log_audit_event(
        db,
        actor_id=user.id,
        actor_username=user.username,
        action="LOGIN",
        entity_type="User",
        entity_id=str(user.id),
        status="SUCCESS",
        metadata_json={"ip": request.client.host if request.client else None}
    )
    
    return {
        "message": "Login successful",
        "role": user.role,
        "username": user.username,
        "plan": user.plan,
        "features": user.features
    }

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
        
    token_version = payload.get("version")
    if token_version is None or token_version != user.token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or been invalidated",
        )
        
    return user

@router.post("/logout")
def logout(response: Response, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    # Invalidate session by incrementing token version
    current_user.token_version += 1
    db.commit()
    
    response.delete_cookie("tableboost_token", path="/")
    log_audit_event(
        db,
        actor_id=current_user.id,
        actor_username=current_user.username,
        action="LOGOUT",
        entity_type="User",
        entity_id=str(current_user.id),
        status="SUCCESS"
    )
    return {"message": "Logout successful"}


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
        
    old_first_name = profile.first_name
    old_last_name = profile.last_name
    
    if profile_data.first_name is not None:
        profile.first_name = profile_data.first_name
    if profile_data.last_name is not None:
        profile.last_name = profile_data.last_name
        
    db.commit()
    db.refresh(profile)
    
    changed_fields = {}
    if old_first_name != profile.first_name:
        changed_fields["first_name"] = {"old": old_first_name, "new": profile.first_name}
    if old_last_name != profile.last_name:
        changed_fields["last_name"] = {"old": old_last_name, "new": profile.last_name}

    log_audit_event(
        db,
        actor_id=current_user.id,
        actor_username=current_user.username,
        action="UPDATE_PROFILE",
        entity_type="UserProfile",
        entity_id=str(profile.id),
        status="SUCCESS",
        metadata_json={
            "changed_fields": changed_fields
        }
    )
    
    return profile

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@router.post("/change-password")
def change_password(data: ChangePasswordRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, current_user.password_hash):
        log_audit_event(
            db,
            actor_id=current_user.id,
            actor_username=current_user.username,
            action="CHANGE_PASSWORD",
            entity_type="User",
            entity_id=str(current_user.id),
            status="FAILED",
            metadata_json={"reason": "Incorrect current password"}
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password",
        )
    
    from modules.users.service import get_password_hash
    current_user.password_hash = get_password_hash(data.new_password)
    current_user.token_version += 1
    db.commit()
    
    log_audit_event(
        db,
        actor_id=current_user.id,
        actor_username=current_user.username,
        action="CHANGE_PASSWORD",
        entity_type="User",
        entity_id=str(current_user.id),
        status="SUCCESS"
    )
    
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
    
    log_audit_event(
        db,
        actor_id=current_user.id,
        actor_username=current_user.username,
        action="CHANGE_SUBSCRIPTION",
        entity_type="Subscription",
        entity_id=str(sub.id),
        status="SUCCESS",
        metadata_json={"plan_name": req.plan_name}
    )
    
    return current_user
