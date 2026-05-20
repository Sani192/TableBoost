from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from modules.loyalty import schemas, service
from modules.auth.router import get_current_user, check_role, check_feature
from fastapi import Depends

router = APIRouter(
    prefix="/api/loyalty", 
    tags=["Loyalty"],
    dependencies=[Depends(check_feature("loyalty"))]
)

# Reward Management
@router.get("/rewards", response_model=List[schemas.LoyaltyRewardResponse], dependencies=[Depends(get_current_user)])
def get_rewards(db: Session = Depends(get_db)):
    return service.get_all_rewards(db)

from modules.governance.service import log_audit_event

@router.post("/rewards", response_model=schemas.LoyaltyRewardResponse)
def create_reward(
    reward: schemas.LoyaltyRewardCreate, 
    current_user = Depends(check_role(["OWNER", "MANAGER"])),
    db: Session = Depends(get_db)
):
    new_reward = service.create_reward(db, reward)
    log_audit_event(
        db,
        actor_id=current_user.id,
        actor_username=current_user.username,
        action="CREATE_REWARD",
        entity_type="LoyaltyReward",
        entity_id=str(new_reward.id),
        status="SUCCESS",
        metadata_json={
            "name": new_reward.name,
            "reward_type": new_reward.reward_type,
            "required_visits": new_reward.required_visits
        }
    )
    return new_reward

@router.patch("/rewards/{reward_id}", response_model=schemas.LoyaltyRewardResponse)
def update_reward(
    reward_id: int, 
    reward: schemas.LoyaltyRewardUpdate, 
    current_user = Depends(check_role(["OWNER", "MANAGER"])),
    db: Session = Depends(get_db)
):
    updated = service.update_reward(db, reward_id, reward)
    if not updated:
        raise HTTPException(status_code=404, detail="Reward not found")
        
    log_audit_event(
        db,
        actor_id=current_user.id,
        actor_username=current_user.username,
        action="UPDATE_REWARD",
        entity_type="LoyaltyReward",
        entity_id=str(updated.id),
        status="SUCCESS",
        metadata_json=reward.dict(exclude_unset=True)
    )
    return updated

# Customer Loyalty
@router.get("/status/{customer_id}", response_model=schemas.LoyaltyStatusResponse, dependencies=[Depends(get_current_user)])
def get_status(customer_id: int, db: Session = Depends(get_db)):
    return service.get_loyalty_status(db, customer_id)

@router.post("/redeem/{customer_id}/{reward_id}", response_model=schemas.RewardRedemptionResponse)
def redeem_reward(
    customer_id: int, 
    reward_id: int, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        redemption = service.redeem_reward(db, customer_id, reward_id)
        log_audit_event(
            db,
            actor_id=current_user.id,
            actor_username=current_user.username,
            action="REDEEM_REWARD",
            entity_type="RewardRedemption",
            entity_id=str(redemption.id),
            status="SUCCESS",
            metadata_json={"customer_id": customer_id, "reward_id": reward_id}
        )
        return redemption
    except ValueError as e:
        log_audit_event(
            db,
            actor_id=current_user.id,
            actor_username=current_user.username,
            action="REDEEM_REWARD",
            entity_type="RewardRedemption",
            entity_id=None,
            status="FAILED",
            metadata_json={"customer_id": customer_id, "reward_id": reward_id, "error": str(e)}
        )
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        log_audit_event(
            db,
            actor_id=current_user.id,
            actor_username=current_user.username,
            action="REDEEM_REWARD",
            entity_type="RewardRedemption",
            entity_id=None,
            status="FAILED",
            metadata_json={"customer_id": customer_id, "reward_id": reward_id, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/history/{customer_id}", response_model=List[schemas.RewardRedemptionResponse], dependencies=[Depends(get_current_user)])
def get_history(customer_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return service.get_redemption_history(db, customer_id, skip=skip, limit=limit)
