from sqlalchemy.orm import Session
from modules.subscriptions.models import Subscription, Plan

def provision_subscription(db: Session, restaurant_id: int, plan_name: str, actions_taken: list) -> Subscription:
    # 1. Fetch Plan by name
    plan = db.query(Plan).filter(Plan.name == plan_name.upper()).first()
    if not plan:
        raise ValueError(f"Subscription plan '{plan_name}' does not exist in the features registry")

    # 2. Check if subscription already exists for this restaurant
    subscription = db.query(Subscription).filter(Subscription.restaurant_id == restaurant_id).first()
    if subscription:
        if subscription.plan_id != plan.id or subscription.status != "ACTIVE":
            subscription.plan_id = plan.id
            subscription.status = "ACTIVE"
            actions_taken.append(f"Updated existing subscription to plan: {plan.name}")
        else:
            actions_taken.append(f"Restaurant already has active subscription to plan: {plan.name}")
        return subscription

    # 3. Create new subscription
    subscription = Subscription(
        restaurant_id=restaurant_id,
        plan_id=plan.id,
        status="ACTIVE"
    )
    db.add(subscription)
    db.flush()

    actions_taken.append(f"Created new subscription to plan: {plan.name}")
    return subscription
