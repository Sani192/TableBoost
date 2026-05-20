import pytest
from modules.users.models import User
from modules.subscriptions.models import Subscription, Plan
from modules.auth.router import get_current_user
from main import app

def test_starter_plan_cannot_access_loyalty(client, db):
    # 1. Create a user
    user = User(username="starter_user", role="OWNER", is_active=True, password_hash="hash")
    db.add(user)
    db.commit()
    db.refresh(user)

    # 2. Get STARTER plan and create a subscription
    plan = db.query(Plan).filter(Plan.name == "STARTER").first()
    assert plan is not None
    sub = Subscription(user_id=user.id, plan_id=plan.id, status="ACTIVE")
    db.add(sub)
    db.commit()

    # 3. Override get_current_user
    app.dependency_overrides[get_current_user] = lambda: user

    # 4. Try to access loyalty endpoint
    response = client.get("/api/loyalty/rewards")
    assert response.status_code == 403
    assert "requires a higher subscription plan" in response.json()["detail"]

    # Clean up
    app.dependency_overrides.pop(get_current_user, None)

def test_growth_plan_can_access_loyalty(client, db):
    # 1. Create a user
    user = User(username="growth_user", role="OWNER", is_active=True, password_hash="hash")
    db.add(user)
    db.commit()
    db.refresh(user)

    # 2. Get GROWTH plan and create a subscription
    plan = db.query(Plan).filter(Plan.name == "GROWTH").first()
    assert plan is not None
    sub = Subscription(user_id=user.id, plan_id=plan.id, status="ACTIVE")
    db.add(sub)
    db.commit()

    # 3. Override get_current_user
    app.dependency_overrides[get_current_user] = lambda: user

    # 4. Try to access loyalty endpoint
    response = client.get("/api/loyalty/rewards")
    # It might return 200 or 404 depending on if rewards exist, but NOT 403!
    assert response.status_code in [200, 404] 

    # Clean up
    app.dependency_overrides.pop(get_current_user, None)

def test_growth_plan_cannot_access_intelligence(client, db):
    # 1. Create a user
    user = User(username="growth_user2", role="OWNER", is_active=True, password_hash="hash")
    db.add(user)
    db.commit()
    db.refresh(user)

    # 2. Get GROWTH plan and create a subscription
    plan = db.query(Plan).filter(Plan.name == "GROWTH").first()
    assert plan is not None
    sub = Subscription(user_id=user.id, plan_id=plan.id, status="ACTIVE")
    db.add(sub)
    db.commit()

    # 3. Override get_current_user
    app.dependency_overrides[get_current_user] = lambda: user

    # 4. Try to access intelligence endpoint
    response = client.get("/api/intelligence/growth")
    assert response.status_code == 403

    # Clean up
    app.dependency_overrides.pop(get_current_user, None)

def test_check_job_feature_access(db):
    from modules.subscriptions.registry import check_job_feature_access
    
    # 1. Create a starter user
    starter_user = User(username="starter_owner", role="OWNER", is_active=True, password_hash="hash")
    db.add(starter_user)
    db.commit()
    db.refresh(starter_user)
    
    plan_starter = db.query(Plan).filter(Plan.name == "STARTER").first()
    sub_starter = Subscription(user_id=starter_user.id, plan_id=plan_starter.id, status="ACTIVE")
    db.add(sub_starter)
    db.commit()
    
    # Starter plan should not have access to 'automation' or 'campaigns'
    assert check_job_feature_access(db, "automation") is False
    assert check_job_feature_access(db, "campaigns") is False
    
    # 2. Upgrade to PRO
    plan_pro = db.query(Plan).filter(Plan.name == "PRO").first()
    sub_starter.plan_id = plan_pro.id
    db.commit()
    
    # Pro plan should have access to 'automation' and 'campaigns'
    assert check_job_feature_access(db, "automation") is True
    assert check_job_feature_access(db, "campaigns") is True

