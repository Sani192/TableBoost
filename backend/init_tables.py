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
        print("Seeding plans...")
        seed_plans(db)

        # Seed default SUPER_ADMIN platform operator
        import os
        from modules.users.service import get_password_hash
        
        super_admin = db.query(User).filter(User.role == "SUPER_ADMIN").first()
        if not super_admin:
            print("Seeding default SUPER_ADMIN platform operator...")
            password = os.environ.get("SUPER_ADMIN_PASSWORD", "superadmin123")
            super_admin = User(
                username="superadmin",
                password_hash=get_password_hash(password),
                role="SUPER_ADMIN",
                is_active=True
            )
            db.add(super_admin)
            db.commit()
            print("SUPER_ADMIN seeded successfully.")
        else:
            print("SUPER_ADMIN platform operator already exists.")

        print("Database initialized successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
