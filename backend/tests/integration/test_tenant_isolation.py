import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from main import app
from modules.users.models import User
from modules.auth.router import get_current_user
from modules.users.service import get_password_hash
from modules.governance.models import AuditLog
from modules.restaurants.models import Restaurant, RestaurantUser
from modules.subscriptions.models import Plan, Subscription
from modules.subscriptions.registry import seed_plans
from modules.customers.models import Customer
from modules.intelligence.models import CampaignSummary, RewardSummary, AutomationSummary, BusinessSummary
from modules.loyalty.models import LoyaltyReward, RewardRedemption
from modules.messaging.models import Campaign
from modules.intelligence.service import (
    get_campaign_roi_list,
    get_reward_effectiveness_list,
    get_automation_effectiveness_list,
    get_summaries_list,
    get_reward_customers
)

def setup_tenant(db: Session, username: str, restaurant_id: int, plan_name: str = "STARTER") -> User:
    # 0. Ensure Restaurant exists
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        restaurant = Restaurant(id=restaurant_id, name=f"Restaurant {restaurant_id}")
        db.add(restaurant)
        db.commit()

    seed_plans(db)
    plan = db.query(Plan).filter(Plan.name == plan_name).first()
    if not plan:
        raise ValueError(f"Plan {plan_name} not found")
        
    user = db.query(User).filter(User.username == username).first()
    if not user:
        user = User(
            username=username,
            password_hash=get_password_hash("password"),
            role="OWNER",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    sub = db.query(Subscription).filter(Subscription.restaurant_id == restaurant_id).first()
    if not sub:
        sub = Subscription(restaurant_id=restaurant_id, plan_id=plan.id, status="ACTIVE")
        db.add(sub)
    else:
        sub.plan_id = plan.id
        sub.status = "ACTIVE"
    db.commit()
    
    link = db.query(RestaurantUser).filter(
        RestaurantUser.user_id == user.id, 
        RestaurantUser.restaurant_id == restaurant_id
    ).first()
    if not link:
        link = RestaurantUser(restaurant_id=restaurant_id, user_id=user.id)
        db.add(link)
        db.commit()
        
    db.refresh(user)
    return user

def test_audit_log_tenant_attribution_login_profile_change_pwd(client, db):
    tenant_a_id = 10
    user_a = setup_tenant(db, "tenant_a_owner", tenant_a_id, "PRO")
    
    # 1. Test Login Tenant Attribution
    response = client.post("/api/auth/login", json={
        "username": "tenant_a_owner",
        "password": "password"
    })
    assert response.status_code == 200
    
    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "tenant_a_owner",
        AuditLog.action == "LOGIN",
        AuditLog.status == "SUCCESS"
    ).order_by(AuditLog.id.desc()).first()
    assert log is not None
    assert log.restaurant_id == tenant_a_id

    # 2. Test Logout Tenant Attribution
    app.dependency_overrides[get_current_user] = lambda: user_a
    
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    
    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "tenant_a_owner",
        AuditLog.action == "LOGOUT",
        AuditLog.status == "SUCCESS"
    ).order_by(AuditLog.id.desc()).first()
    assert log is not None
    assert log.restaurant_id == tenant_a_id
    
    # 3. Test Profile Update Tenant Attribution
    # Initialize profile
    client.get("/api/auth/profile")
    response = client.put("/api/auth/profile", json={
        "first_name": "TenantA",
        "last_name": "Owner"
    })
    assert response.status_code == 200
    
    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "tenant_a_owner",
        AuditLog.action == "UPDATE_PROFILE"
    ).order_by(AuditLog.id.desc()).first()
    assert log is not None
    assert log.restaurant_id == tenant_a_id

    # 4. Test Change Password Tenant Attribution
    response = client.post("/api/auth/change-password", json={
        "current_password": "password",
        "new_password": "newpassword"
    })
    assert response.status_code == 200
    
    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "tenant_a_owner",
        AuditLog.action == "CHANGE_PASSWORD",
        AuditLog.status == "SUCCESS"
    ).order_by(AuditLog.id.desc()).first()
    assert log is not None
    assert log.restaurant_id == tenant_a_id

    # 5. Test Subscription Upgrade Tenant Attribution
    response = client.post("/api/auth/subscription", json={
        "plan_name": "GROWTH"
    }, headers={"X-Restaurant-ID": str(tenant_a_id)})
    assert response.status_code == 200
    
    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "tenant_a_owner",
        AuditLog.action == "CHANGE_SUBSCRIPTION"
    ).order_by(AuditLog.id.desc()).first()
    assert log is not None
    assert log.restaurant_id == tenant_a_id

    app.dependency_overrides.pop(get_current_user, None)

def test_analytics_tenant_isolation(db):
    from datetime import datetime
    tenant_a_id = 11
    tenant_b_id = 12
    
    # Setup tenants
    setup_tenant(db, "owner_a", tenant_a_id)
    setup_tenant(db, "owner_b", tenant_b_id)
    
    # Create campaigns and summaries for A
    camp_a = Campaign(restaurant_id=tenant_a_id, name="Campaign A", message_template="A", audience_type="all", status="completed")
    db.add(camp_a)
    db.commit()
    db.refresh(camp_a)
    
    summary_a = CampaignSummary(restaurant_id=tenant_a_id, campaign_id=camp_a.id, total_sent=10, revenue_attributed=100.0)
    db.add(summary_a)
    
    # Create campaigns and summaries for B
    camp_b = Campaign(restaurant_id=tenant_b_id, name="Campaign B", message_template="B", audience_type="all", status="completed")
    db.add(camp_b)
    db.commit()
    db.refresh(camp_b)
    
    summary_b = CampaignSummary(restaurant_id=tenant_b_id, campaign_id=camp_b.id, total_sent=20, revenue_attributed=500.0)
    db.add(summary_b)
    db.commit()
    
    # Verify Campaign ROI list isolation
    roi_a = get_campaign_roi_list(db, tenant_a_id)
    assert len(roi_a) == 1
    assert roi_a[0]["campaign_name"] == "Campaign A"
    
    roi_b = get_campaign_roi_list(db, tenant_b_id)
    assert len(roi_b) == 1
    assert roi_b[0]["campaign_name"] == "Campaign B"

    # Create business summaries for A and B
    bs_a = BusinessSummary(
        restaurant_id=tenant_a_id, 
        period_type="weekly", 
        period_start=datetime.now(), 
        period_end=datetime.now(), 
        metrics={"total_revenue": 150.0}
    )
    bs_b = BusinessSummary(
        restaurant_id=tenant_b_id, 
        period_type="weekly", 
        period_start=datetime.now(), 
        period_end=datetime.now(), 
        metrics={"total_revenue": 900.0}
    )
    db.add(bs_a)
    db.add(bs_b)
    db.commit()
    
    # Verify Business Summary isolation
    summaries_a = get_summaries_list(db, tenant_a_id)
    assert len(summaries_a) == 1
    assert summaries_a[0]["metrics"]["total_revenue"] == 150.0
    
    summaries_b = get_summaries_list(db, tenant_b_id)
    assert len(summaries_b) == 1
    assert summaries_b[0]["metrics"]["total_revenue"] == 900.0

def test_customer_intelligence_idor_prevention(client, db):
    tenant_a_id = 15
    tenant_b_id = 16
    
    user_a = setup_tenant(db, "owner_a_idor", tenant_a_id, "PRO")
    setup_tenant(db, "owner_b_idor", tenant_b_id, "PRO")
    
    # Create customer for Tenant B
    customer_b = Customer(restaurant_id=tenant_b_id, name="Tenant B Customer", phone_number="5554443333")
    db.add(customer_b)
    db.commit()
    db.refresh(customer_b)
    
    # Authenticate as User A
    app.dependency_overrides[get_current_user] = lambda: user_a
    
    # Attempt to request Tenant B's customer intelligence from Tenant A's endpoint context
    response = client.get(
        f"/api/intelligence/customer/{customer_b.id}",
        headers={"X-Restaurant-ID": str(tenant_a_id)}
    )
    # Must be 404 because customer belongs to a different tenant
    assert response.status_code == 404
    
    app.dependency_overrides.pop(get_current_user, None)
