from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from modules.loyalty import schemas, service

router = APIRouter(prefix="/api/loyalty", tags=["Loyalty"])

# Reward Management
@router.get("/rewards", response_model=List[schemas.LoyaltyRewardResponse])
def get_rewards(db: Session = Depends(get_db)):
    return service.get_all_rewards(db)

@router.post("/rewards", response_model=schemas.LoyaltyRewardResponse)
def create_reward(reward: schemas.LoyaltyRewardCreate, db: Session = Depends(get_db)):
    return service.create_reward(db, reward)

@router.patch("/rewards/{reward_id}", response_model=schemas.LoyaltyRewardResponse)
def update_reward(reward_id: int, reward: schemas.LoyaltyRewardUpdate, db: Session = Depends(get_db)):
    updated = service.update_reward(db, reward_id, reward)
    if not updated:
        raise HTTPException(status_code=404, detail="Reward not found")
    return updated

# Customer Loyalty
@router.get("/status/{customer_id}", response_model=schemas.LoyaltyStatusResponse)
def get_status(customer_id: int, db: Session = Depends(get_db)):
    return service.get_loyalty_status(db, customer_id)

@router.post("/redeem/{customer_id}/{reward_id}", response_model=schemas.RewardRedemptionResponse)
def redeem_reward(customer_id: int, reward_id: int, db: Session = Depends(get_db)):
    try:
        return service.redeem_reward(db, customer_id, reward_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/history/{customer_id}", response_model=List[schemas.RewardRedemptionResponse])
def get_history(customer_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return service.get_redemption_history(db, customer_id, skip=skip, limit=limit)
