from sqlalchemy.orm import Session
from modules.restaurants.models import Restaurant, RestaurantUser
from modules.subscriptions.models import Subscription
from modules.settings.models import Setting
from modules.automation.models import AutomationConfig
from modules.loyalty.models import LoyaltyReward
from core.scheduler import scheduler

def validate_tenant_health(db: Session, restaurant_id: int) -> dict:
    details = {
        "restaurant_exists": False,
        "owner_exists": False,
        "subscription_active": False,
        "subscription_plan": None,
        "settings_count": 0,
        "automations_count": 0,
        "loyalty_rewards_count": 0,
        "scheduler_jobs_count": 0
    }

    # 1. Restaurant check
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        return {
            "status": "degraded",
            "restaurant_id": restaurant_id,
            "details": details
        }
    details["restaurant_exists"] = True

    # 2. Owner check (mapped to RestaurantUser)
    owners = db.query(RestaurantUser).join(RestaurantUser.user).filter(
        RestaurantUser.restaurant_id == restaurant_id,
        RestaurantUser.user.has(role="OWNER")
    ).count()
    details["owner_exists"] = owners > 0

    # 3. Subscription check
    sub = db.query(Subscription).filter(
        Subscription.restaurant_id == restaurant_id,
        Subscription.status == "ACTIVE"
    ).first()
    if sub:
        details["subscription_active"] = True
        details["subscription_plan"] = sub.plan.name if sub.plan else None

    # 4. Settings check
    expected_settings = ["review_message_template", "auto_send_sms", "campaign_inactive_days"]
    settings_count = db.query(Setting).filter(
        Setting.restaurant_id == restaurant_id,
        Setting.key.in_(expected_settings)
    ).count()
    details["settings_count"] = settings_count

    # 5. Automation configs check
    automations_count = db.query(AutomationConfig).filter(
        AutomationConfig.restaurant_id == restaurant_id
    ).count()
    details["automations_count"] = automations_count

    # 6. Loyalty rewards check
    loyalty_count = db.query(LoyaltyReward).filter(
        LoyaltyReward.restaurant_id == restaurant_id,
        LoyaltyReward.is_active == True
    ).count()
    details["loyalty_rewards_count"] = loyalty_count

    # 7. Scheduler jobs check
    try:
        jobs = scheduler.get_jobs()
        tenant_prefix = f"auto_{restaurant_id}_"
        tenant_jobs_count = sum(1 for j in jobs if j.id.startswith(tenant_prefix))
        details["scheduler_jobs_count"] = tenant_jobs_count
    except Exception:
        details["scheduler_jobs_count"] = 0

    # Determine overall status
    is_healthy = (
        details["restaurant_exists"] and
        details["owner_exists"] and
        details["subscription_active"] and
        details["settings_count"] >= len(expected_settings) and
        details["automations_count"] >= 4 and
        details["loyalty_rewards_count"] >= 2
    )

    return {
        "status": "healthy" if is_healthy else "degraded",
        "restaurant_id": restaurant_id,
        "details": details
    }
