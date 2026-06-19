from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings
import time
import logging

logger = logging.getLogger(__name__)

# Resilient connection initialization
MAX_RETRIES = 5
RETRY_DELAY_SEC = 2

for attempt in range(1, MAX_RETRIES + 1):
    try:
        engine = create_engine(settings.DATABASE_URL)
        # Attempt to connect
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection established successfully.")
        break
    except Exception as e:
        logger.warning(f"Database connection failed (Attempt {attempt}/{MAX_RETRIES}): {e}")
        if attempt < MAX_RETRIES:
            logger.info(f"Retrying in {RETRY_DELAY_SEC} seconds...")
            time.sleep(RETRY_DELAY_SEC)
        else:
            logger.error("FATAL: Could not connect to the database after maximum retries.")
            raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_default_restaurant_id():
    import os
    if os.environ.get("TESTING") == "1":
        return 1
    return None

def import_all_models() -> None:
    """Import all SQLAlchemy models to ensure they are registered with Base.metadata."""
    from modules.users.models import User, UserProfile  # noqa: F401
    from modules.restaurants.models import Restaurant, RestaurantUser  # noqa: F401
    from modules.customers.models import Customer, CustomerProfile  # noqa: F401
    from modules.visits.models import Visit  # noqa: F401
    from modules.messaging.models import Message, Campaign  # noqa: F401
    from modules.loyalty.models import LoyaltyReward, LoyaltyProgress, RewardRedemption  # noqa: F401
    from modules.automation.models import AutomationConfig, AutomationHistory  # noqa: F401
    from modules.intelligence.models import (  # noqa: F401
        CustomerIntelligence, CampaignSummary, RewardSummary,
        AutomationSummary, BusinessSummary, Recommendation,
    )
    from modules.governance.models import AuditLog, OperationalLog  # noqa: F401
    from modules.subscriptions.models import Feature, Plan, PlanFeature, Subscription  # noqa: F401
    from modules.settings.models import Setting  # noqa: F401

