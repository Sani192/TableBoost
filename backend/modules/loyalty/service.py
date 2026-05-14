from sqlalchemy.orm import Session
from sqlalchemy import func
from modules.loyalty.models import LoyaltyReward, LoyaltyProgress, RewardRedemption
from typing import List, Optional

def get_active_rewards(db: Session):
    return db.query(LoyaltyReward).filter(LoyaltyReward.is_active == True).order_by(LoyaltyReward.required_visits.asc()).all()

def get_all_rewards(db: Session):
    return db.query(LoyaltyReward).order_by(LoyaltyReward.required_visits.asc()).all()

def create_reward(db: Session, reward_data):
    reward = LoyaltyReward(**reward_data.dict())
    db.add(reward)
    db.commit()
    db.refresh(reward)
    return reward

def update_reward(db: Session, reward_id: int, reward_data):
    reward = db.query(LoyaltyReward).filter(LoyaltyReward.id == reward_id).first()
    if not reward:
        return None
    
    for key, value in reward_data.dict(exclude_unset=True).items():
        setattr(reward, key, value)
    
    db.commit()
    db.refresh(reward)
    return reward

def get_loyalty_status(db: Session, customer_id: int):
    # Get progress
    progress = db.query(LoyaltyProgress).filter(LoyaltyProgress.customer_id == customer_id).first()
    lifetime_visits = progress.lifetime_visits if progress else 0
    
    # Get active rewards
    rewards = get_active_rewards(db)
    
    # Get redemption history for this customer
    redemptions = db.query(RewardRedemption.reward_id).filter(RewardRedemption.customer_id == customer_id).all()
    redeemed_ids = {r[0] for r in redemptions if r[0] is not None}
    
    reward_statuses = []
    for r in rewards:
        reward_statuses.append({
            "reward_id": r.id,
            "name": r.name,
            "description": r.description,
            "required_visits": r.required_visits,
            "is_eligible": lifetime_visits >= r.required_visits and r.id not in redeemed_ids,
            "is_redeemed": r.id in redeemed_ids
        })
        
    return {
        "customer_id": customer_id,
        "lifetime_visits": lifetime_visits,
        "rewards": reward_statuses
    }

def update_loyalty_progress(db: Session, customer_id: int):
    progress = db.query(LoyaltyProgress).filter(LoyaltyProgress.customer_id == customer_id).first()
    
    if not progress:
        progress = LoyaltyProgress(customer_id=customer_id, lifetime_visits=1)
        db.add(progress)
    else:
        progress.lifetime_visits += 1
        db.add(progress)
    
    db.flush()
    return progress

def redeem_reward(db: Session, customer_id: int, reward_id: int):
    reward = db.query(LoyaltyReward).filter(LoyaltyReward.id == reward_id, LoyaltyReward.is_active == True).first()
    if not reward:
        raise ValueError("Reward not found or inactive")
        
    # Check if already redeemed
    existing = db.query(RewardRedemption).filter(
        RewardRedemption.customer_id == customer_id,
        RewardRedemption.reward_id == reward_id
    ).first()
    if existing:
        raise ValueError("Reward already redeemed")
        
    # Check eligibility
    progress = db.query(LoyaltyProgress).filter(LoyaltyProgress.customer_id == customer_id).first()
    lifetime_visits = progress.lifetime_visits if progress else 0
    
    if lifetime_visits < reward.required_visits:
        raise ValueError(f"Customer has not reached the {reward.required_visits} visits milestone")
        
    # Record redemption
    redemption = RewardRedemption(
        customer_id=customer_id,
        reward_id=reward_id,
        reward_name=reward.name,
        visits_threshold=reward.required_visits
    )
    db.add(redemption)
    
    db.commit()
    db.refresh(redemption)
    return redemption

def get_redemption_history(db: Session, customer_id: int, skip: int = 0, limit: int = 20):
    return db.query(RewardRedemption)\
        .filter(RewardRedemption.customer_id == customer_id)\
        .order_by(RewardRedemption.redeemed_at.desc())\
        .offset(skip).limit(limit).all()

def get_eligible_count(db: Session):
    # This is slightly more complex now. We want unique customers who have at least ONE eligible reward.
    # For performance in a simple app, we can just do a subquery or join.
    active_rewards = get_active_rewards(db)
    if not active_rewards:
        return 0
        
    # For each customer, check if lifetime_visits >= min(required_visits)
    # AND they haven't redeemed ALL rewards at their level.
    # Simple approximation for dashboard: count customers who reached the LOWEST active milestone.
    min_milestone = active_rewards[0].required_visits
    return db.query(LoyaltyProgress).filter(LoyaltyProgress.lifetime_visits >= min_milestone).count()

def get_total_redemption_count(db: Session):
    return db.query(RewardRedemption).count()
