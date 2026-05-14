import pytest
from modules.loyalty import service as loyalty_service
from modules.loyalty import schemas
from modules.loyalty.models import LoyaltyReward, LoyaltyProgress, RewardRedemption

def test_multi_reward_milestones(db, create_customer):
    customer = create_customer(phone_number="1234567890", name="Multi Reward Test")
    
    # 1. Create two rewards: 5 visits and 10 visits
    r1 = loyalty_service.create_reward(db, schemas.LoyaltyRewardCreate(
        name="Free Drink", required_visits=5, description="5 visits"
    ))
    r2 = loyalty_service.create_reward(db, schemas.LoyaltyRewardCreate(
        name="Free Meal", required_visits=10, description="10 visits"
    ))
    
    # 2. Increment visits to 6
    for _ in range(6):
        loyalty_service.update_loyalty_progress(db, customer.id)
    
    # 3. Check status
    status = loyalty_service.get_loyalty_status(db, customer.id)
    assert status["lifetime_visits"] == 6
    assert len(status["rewards"]) == 2
    
    # r1 should be eligible, r2 should not
    r1_status = next(r for r in status["rewards"] if r["reward_id"] == r1.id)
    r2_status = next(r for r in status["rewards"] if r["reward_id"] == r2.id)
    
    assert r1_status["is_eligible"] is True
    assert r2_status["is_eligible"] is False

def test_cumulative_visits_no_reset(db, create_customer):
    customer = create_customer(phone_number="0987654321", name="No Reset Test")
    
    r1 = loyalty_service.create_reward(db, schemas.LoyaltyRewardCreate(
        name="Reward 5", required_visits=5
    ))
    
    # Increment to 5
    for _ in range(5):
        loyalty_service.update_loyalty_progress(db, customer.id)
    
    # Redeem
    loyalty_service.redeem_reward(db, customer.id, r1.id)
    
    # Verify lifetime_visits is STILL 5
    status = loyalty_service.get_loyalty_status(db, customer.id)
    assert status["lifetime_visits"] == 5
    
    # Verify reward is marked as redeemed
    r1_status = next(r for r in status["rewards"] if r["reward_id"] == r1.id)
    assert r1_status["is_redeemed"] is True
    assert r1_status["is_eligible"] is False

def test_independent_redemptions(db, create_customer):
    customer = create_customer(phone_number="1112223333", name="Independent Test")
    
    r1 = loyalty_service.create_reward(db, schemas.LoyaltyRewardCreate(
        name="Reward A", required_visits=2
    ))
    r2 = loyalty_service.create_reward(db, schemas.LoyaltyRewardCreate(
        name="Reward B", required_visits=2
    ))
    
    # Increment to 2
    loyalty_service.update_loyalty_progress(db, customer.id)
    loyalty_service.update_loyalty_progress(db, customer.id)
    
    # Redeem Reward A
    loyalty_service.redeem_reward(db, customer.id, r1.id)
    
    status = loyalty_service.get_loyalty_status(db, customer.id)
    r1_status = next(r for r in status["rewards"] if r["reward_id"] == r1.id)
    r2_status = next(r for r in status["rewards"] if r["reward_id"] == r2.id)
    
    assert r1_status["is_redeemed"] is True
    assert r2_status["is_redeemed"] is False
    assert r2_status["is_eligible"] is True

def test_prevent_double_redemption(db, create_customer):
    customer = create_customer(phone_number="4445556666")
    r1 = loyalty_service.create_reward(db, schemas.LoyaltyRewardCreate(
        name="One-Time", required_visits=1
    ))
    
    loyalty_service.update_loyalty_progress(db, customer.id)
    
    # Redeem first time
    loyalty_service.redeem_reward(db, customer.id, r1.id)
    
    # Try second time
    with pytest.raises(ValueError, match="Reward already redeemed"):
        loyalty_service.redeem_reward(db, customer.id, r1.id)

def test_activation_deactivation(db, create_customer):
    customer = create_customer(phone_number="7778889999")
    r1 = loyalty_service.create_reward(db, schemas.LoyaltyRewardCreate(
        name="Inactive", required_visits=1, is_active=False
    ))
    
    loyalty_service.update_loyalty_progress(db, customer.id)
    
    # Check status - inactive rewards shouldn't even appear in status usually, 
    # or should not be eligible. Our service filters active rewards.
    status = loyalty_service.get_loyalty_status(db, customer.id)
    assert len(status["rewards"]) == 0
    
    # Try to redeem
    with pytest.raises(ValueError, match="Reward not found or inactive"):
        loyalty_service.redeem_reward(db, customer.id, r1.id)
