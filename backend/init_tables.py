from core.database import engine, Base, SessionLocal
from modules.restaurants.models import Restaurant, RestaurantUser
from modules.users.models import User
from modules.settings.models import Setting
from modules.customers.models import Customer, CustomerProfile
from modules.visits.models import Visit
from modules.messaging.models import Message, Campaign
from modules.loyalty.models import LoyaltyReward, LoyaltyProgress, RewardRedemption
from modules.automation.models import AutomationConfig, AutomationHistory
from modules.intelligence.models import CustomerIntelligence, CampaignSummary, RewardSummary, AutomationSummary, BusinessSummary, Recommendation
from modules.governance.models import AuditLog, OperationalLog
from modules.subscriptions.models import Subscription, Feature, Plan, PlanFeature
from modules.subscriptions.registry import seed_plans
from modules.automation import service as automation_service

def init_db():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        from modules.restaurants.models import Restaurant
        
        default_rest = db.query(Restaurant).first()
        if not default_rest:
            print("Creating Default Restaurant...")
            default_rest = Restaurant(name="Default Restaurant")
            db.add(default_rest)
            db.commit()
            db.refresh(default_rest)
            
        # Initialize default automations for the default restaurant
        defaults = [
            {
                "automation_type": "birthday",
                "is_enabled": True,
                "message_template": "Happy Birthday {name}! 🎂 Enjoy a free drink on us today at TableBoost!"
            },
            {
                "automation_type": "anniversary",
                "is_enabled": True,
                "message_template": "Happy Anniversary {name}! ❤️ Thanks for being with us for another year. Here is a special treat for you!"
            },
            {
                "automation_type": "inactivity",
                "is_enabled": False,
                "message_template": "Hi {name}, we haven't seen you in a while! 🍕 Come visit us this week and get 10% off your bill."
            },
            {
                "automation_type": "reward_unlocked",
                "is_enabled": True,
                "message_template": "Congratulations {name}! 🏆 You've just unlocked a new reward. Visit us to redeem it!"
            },
            {
                "automation_type": "daily_intelligence",
                "is_enabled": True,
                "message_template": "System: Daily intelligence computation",
                "schedule": "cron:02:00"
            },
            {
                "automation_type": "daily_recommendations",
                "is_enabled": True,
                "message_template": "System: Daily recommendations evaluation",
                "schedule": "cron:06:00"
            },
            {
                "automation_type": "weekly_summary",
                "is_enabled": True,
                "message_template": "System: Weekly business summary",
                "schedule": "cron:03:00"
            },
            {
                "automation_type": "monthly_summary",
                "is_enabled": True,
                "message_template": "System: Monthly business summary",
                "schedule": "cron:03:00"
            }
        ]
        
        for d in defaults:
            automation_service.update_automation_config(db, default_rest.id, d)
            
        print("Seeding plans...")
        seed_plans(db)
        print("Database initialized successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
