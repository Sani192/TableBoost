import os
import sys
from datetime import datetime, date, timedelta

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

# Override environment variables for the seeder
os.environ["TESTING"] = "1"
# Ensure we use the sentinel test database URL
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///" + os.path.abspath(os.path.join(os.path.dirname(__file__), '../sentinel_test.db'))

from core.database import engine, Base, SessionLocal
from modules.subscriptions.registry import seed_plans
from modules.restaurants.models import Restaurant, RestaurantUser
from modules.users.models import User, UserProfile
from modules.users.service import get_password_hash
from modules.subscriptions.models import Subscription, Plan, Feature, PlanFeature
from modules.customers.models import Customer, CustomerProfile
from modules.visits.models import Visit
from modules.loyalty.models import LoyaltyReward, LoyaltyProgress, RewardRedemption
from modules.automation.models import AutomationConfig, AutomationHistory
from modules.automation import service as automation_service
from modules.governance.models import AuditLog, OperationalLog
from modules.intelligence.models import (
    CustomerIntelligence,
    CampaignSummary,
    RewardSummary,
    AutomationSummary,
    BusinessSummary,
    Recommendation,
)
from modules.messaging.models import Message, Campaign
from modules.settings.models import Setting

def reset_and_seed():
    print(f"Connecting to database: {os.environ['DATABASE_URL']}")
    
    # 1. Recreate tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 2. Seed plans
        print("Seeding plans...")
        seed_plans(db)
        
        # 3. Create Restaurants
        print("Seeding restaurants...")
        diner = Restaurant(id=1, name="Sentinel Diner", timezone="UTC", status="ACTIVE")
        leak_palace = Restaurant(id=2, name="Leak Palace", timezone="UTC", status="ACTIVE")
        db.add_all([diner, leak_palace])
        db.commit()
        
        # 4. Associate subscriptions
        print("Seeding subscriptions...")
        pro_plan = db.query(Plan).filter(Plan.name == "PRO").first()
        starter_plan = db.query(Plan).filter(Plan.name == "STARTER").first()
        
        sub_diner = Subscription(restaurant_id=1, plan_id=pro_plan.id, status="ACTIVE")
        sub_leak = Subscription(restaurant_id=2, plan_id=starter_plan.id, status="ACTIVE")
        db.add_all([sub_diner, sub_leak])
        db.commit()
        
        # 5. Create users
        print("Seeding users...")
        pwd_hash = get_password_hash("password123")
        
        # Restaurant 1 (Sentinel Diner) Users
        owner_profile = UserProfile(first_name="Sentinel", last_name="Owner")
        db.add(owner_profile)
        db.flush()
        owner = User(
            id=1,
            username="sentinel_owner",
            password_hash=pwd_hash,
            role="OWNER",
            is_active=True,
            profile_id=owner_profile.id
        )
        
        manager_profile = UserProfile(first_name="Sentinel", last_name="Manager")
        db.add(manager_profile)
        db.flush()
        manager = User(
            id=2,
            username="sentinel_manager",
            password_hash=pwd_hash,
            role="MANAGER",
            is_active=True,
            profile_id=manager_profile.id
        )
        
        staff_profile = UserProfile(first_name="Sentinel", last_name="Staff")
        db.add(staff_profile)
        db.flush()
        staff = User(
            id=3,
            username="sentinel_staff",
            password_hash=pwd_hash,
            role="STAFF",
            is_active=True,
            profile_id=staff_profile.id
        )
        
        # Restaurant 2 (Leak Palace) Users
        leak_owner_profile = UserProfile(first_name="Leak", last_name="Owner")
        db.add(leak_owner_profile)
        db.flush()
        leak_owner = User(
            id=4,
            username="leak_owner",
            password_hash=pwd_hash,
            role="OWNER",
            is_active=True,
            profile_id=leak_owner_profile.id
        )
        
        db.add_all([owner, manager, staff, leak_owner])
        db.commit()
        
        # Link users to restaurants
        link1 = RestaurantUser(restaurant_id=1, user_id=1)
        link2 = RestaurantUser(restaurant_id=1, user_id=2)
        link3 = RestaurantUser(restaurant_id=1, user_id=3)
        link4 = RestaurantUser(restaurant_id=2, user_id=4)
        db.add_all([link1, link2, link3, link4])
        db.commit()
        
        # 6. Create rewards
        print("Seeding rewards...")
        reward_soda = LoyaltyReward(
            restaurant_id=1,
            name="Free Soda",
            description="Enjoy a free beverage",
            required_visits=3,
            reward_type="milestone",
            is_active=True
        )
        reward_burger = LoyaltyReward(
            restaurant_id=1,
            name="Free Burger",
            description="Enjoy a free gourmet burger",
            required_visits=5,
            reward_type="milestone",
            is_active=True
        )
        reward_bday = LoyaltyReward(
            restaurant_id=1,
            name="Birthday Cake",
            description="Free slice of cake on your birthday",
            required_visits=0,
            reward_type="birthday",
            is_active=True
        )
        db.add_all([reward_soda, reward_burger, reward_bday])
        db.commit()
        
        # 7. Create default automations
        print("Seeding automations...")
        defaults = [
            {"restaurant_id": 1, "automation_type": "birthday", "is_enabled": True, "message_template": "Happy Birthday {name}! 🎂 Enjoy a free drink at Sentinel Diner!"},
            {"restaurant_id": 1, "automation_type": "anniversary", "is_enabled": True, "message_template": "Happy Anniversary {name}! ❤️ Enjoy a free appetizer at Sentinel Diner!"},
            {"restaurant_id": 1, "automation_type": "inactivity", "is_enabled": True, "message_template": "We miss you {name}! 🍕 Come back this week and get 10% off.", "settings": {"days": 30}},
            {"restaurant_id": 1, "automation_type": "reward_unlocked", "is_enabled": True, "message_template": "Congrats {name}! 🏆 You unlocked a free reward!"},
            {"restaurant_id": 2, "automation_type": "birthday", "is_enabled": False, "message_template": "Happy Birthday {name}! 🎂 - Leak Palace"},
        ]
        for d in defaults:
            cfg = AutomationConfig(**d)
            db.add(cfg)
        db.commit()
        
        # 8. Create customers & visits
        print("Seeding customers & visits...")
        # Tenant 1 customer with visits
        cust1 = Customer(restaurant_id=1, name="Alice Spender", phone_number="5550101")
        db.add(cust1)
        db.flush()
        
        profile1 = CustomerProfile(
            restaurant_id=1,
            customer_id=cust1.id,
            birthday=date.today(),
            anniversary=date.today() - timedelta(days=365)
        )
        db.add(profile1)
        
        # Add visits for Alice to get loyalty and revenue metrics
        v1 = Visit(restaurant_id=1, customer_id=cust1.id, amount=25.50, visited_at=datetime.now() - timedelta(days=5))
        v2 = Visit(restaurant_id=1, customer_id=cust1.id, amount=30.00, visited_at=datetime.now() - timedelta(days=2))
        db.add_all([v1, v2])
        
        # Loyalty Progress
        prog1 = LoyaltyProgress(customer_id=cust1.id, lifetime_visits=2)
        db.add(prog1)
        
        # Tenant 2 customer (Bob Leaker)
        cust2 = Customer(restaurant_id=2, name="Bob Leaker", phone_number="5550202")
        db.add(cust2)
        db.flush()
        
        v3 = Visit(restaurant_id=2, customer_id=cust2.id, amount=10.00, visited_at=datetime.now() - timedelta(days=1))
        db.add(v3)
        prog2 = LoyaltyProgress(customer_id=cust2.id, lifetime_visits=1)
        db.add(prog2)
        
        db.commit()
        print("Database seeding completed successfully.")
        
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_seed()
