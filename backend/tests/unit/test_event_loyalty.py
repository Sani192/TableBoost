import pytest
from datetime import date, timedelta
from modules.loyalty import service as loyalty_service
from modules.loyalty.models import LoyaltyReward
from modules.customers.models import Customer, CustomerProfile
from modules.customers import service as customer_service

@pytest.fixture
def birthday_reward(db):
    reward = LoyaltyReward(
        name="Birthday Treat",
        description="Happy Birthday!",
        required_visits=0,
        reward_type="birthday",
        is_active=True
    )
    db.add(reward)
    db.commit()
    return reward

@pytest.fixture
def anniversary_reward(db):
    reward = LoyaltyReward(
        name="Anniversary Special",
        description="Happy Anniversary!",
        required_visits=0,
        reward_type="anniversary",
        is_active=True
    )
    db.add(reward)
    db.commit()
    return reward

@pytest.fixture
def test_customer(db):
    customer = Customer(
        phone_number="1112223333",
        name="Event Tester"
    )
    db.add(customer)
    db.flush()
    profile = CustomerProfile(
        customer_id=customer.id,
        birthday=date.today(),
        anniversary=date.today()
    )
    db.add(profile)
    db.commit()
    return customer

def test_birthday_eligibility(db, test_customer, birthday_reward):
    # Case 1: Today is birthday
    status = loyalty_service.get_loyalty_status(db, test_customer.id)
    reward_status = next(r for r in status["rewards"] if r["reward_id"] == birthday_reward.id)
    assert reward_status["is_eligible"] is True
    assert reward_status["is_redeemed"] is False

    # Case 2: Not birthday (e.g. tomorrow)
    customer_profile = db.query(CustomerProfile).filter(CustomerProfile.customer_id == test_customer.id).first()
    customer_profile.birthday = date.today() + timedelta(days=1)
    db.commit()
    status = loyalty_service.get_loyalty_status(db, test_customer.id)
    reward_status = next(r for r in status["rewards"] if r["reward_id"] == birthday_reward.id)
    assert reward_status["is_eligible"] is False

def test_anniversary_eligibility(db, test_customer, anniversary_reward):
    # Case 1: Today is anniversary
    status = loyalty_service.get_loyalty_status(db, test_customer.id)
    reward_status = next(r for r in status["rewards"] if r["reward_id"] == anniversary_reward.id)
    assert reward_status["is_eligible"] is True

def test_yearly_redemption_prevention(db, test_customer, birthday_reward):
    # 1. Redeem birthday reward today
    loyalty_service.redeem_reward(db, test_customer.id, birthday_reward.id)
    
    # 2. Check status (should be redeemed)
    status = loyalty_service.get_loyalty_status(db, test_customer.id)
    reward_status = next(r for r in status["rewards"] if r["reward_id"] == birthday_reward.id)
    assert reward_status["is_eligible"] is False
    assert reward_status["is_redeemed"] is True
    
    # 3. Attempt duplicate redemption (should fail)
    with pytest.raises(ValueError, match="Reward already redeemed"):
        loyalty_service.redeem_reward(db, test_customer.id, birthday_reward.id)

def test_dashboard_celebrations(db, test_customer):
    # Both birthday and anniversary are today
    celebs = loyalty_service.get_today_celebrations(db)
    assert celebs["birthdays"] == 1
    assert celebs["anniversaries"] == 1
    
    # Change date
    customer_profile = db.query(CustomerProfile).filter(CustomerProfile.customer_id == test_customer.id).first()
    customer_profile.birthday = date.today() - timedelta(days=1)
    db.commit()
    celebs = loyalty_service.get_today_celebrations(db)
    assert celebs["birthdays"] == 0
