import pytest
from main import app
from modules.users.models import User
from modules.auth.router import get_current_user
from modules.users.service import get_password_hash
from modules.governance.models import AuditLog, OperationalLog
from modules.automation.service import run_system_job
from modules.customers.models import Customer
from modules.subscriptions.registry import seed_plans
from modules.subscriptions.models import Plan, Subscription

def setup_user_with_subscription(db, username: str, plan_name: str) -> User:
    # 1. Ensure plans are seeded
    seed_plans(db)
    
    # 2. Get the plan
    plan = db.query(Plan).filter(Plan.name == plan_name).first()
    if not plan:
        raise ValueError(f"Plan {plan_name} not found")
        
    # 3. Create owner
    owner = User(
        username=username,
        password_hash=get_password_hash("password"),
        role="OWNER",
        is_active=True
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)
    
    # 4. Create active subscription
    sub = db.query(Subscription).filter(Subscription.restaurant_id == 1).first()
    if not sub:
        sub = Subscription(restaurant_id=1, plan_id=plan.id, status="ACTIVE")
        db.add(sub)
    else:
        sub.plan_id = plan.id
        sub.status = "ACTIVE"
    db.commit()

    # 5. Create RestaurantUser link
    from modules.restaurants.models import RestaurantUser
    link = db.query(RestaurantUser).filter(RestaurantUser.user_id == owner.id, RestaurantUser.restaurant_id == 1).first()
    if not link:
        link = RestaurantUser(restaurant_id=1, user_id=owner.id)
        db.add(link)
        db.commit()
    
    db.refresh(owner)
    return owner

def test_log_audit_event_on_profile_update(client, db):
    # Setup owner user with subscription
    owner = setup_user_with_subscription(db, "owner_audit", "STARTER")

    # Override current user
    app.dependency_overrides[get_current_user] = lambda: owner

    # Call GET profile to initialize the profile
    client.get("/api/auth/profile")

    # Call PUT profile to trigger audit log hook
    response = client.put("/api/auth/profile", json={
        "first_name": "Audit",
        "last_name": "Tester"
    })
    assert response.status_code == 200

    # Verify that an AuditLog has been written to the database
    log = db.query(AuditLog).filter(AuditLog.actor_username == "owner_audit").first()
    assert log is not None
    assert log.action == "UPDATE_PROFILE"
    assert log.status == "SUCCESS"
    assert log.metadata_json["changed_fields"]["first_name"]["new"] == "Audit"

    # Clean up override
    app.dependency_overrides.pop(get_current_user, None)

def test_governance_api_rbac_gating(client, db):
    # Setup owner and manager users
    owner = setup_user_with_subscription(db, "owner_user", "PRO")
    manager = User(
        username="manager_user",
        password_hash=get_password_hash("password"),
        role="MANAGER",
        is_active=True
    )
    db.add(manager)
    db.commit()

    # Case A: Owner accessing Audit logs -> 200
    app.dependency_overrides[get_current_user] = lambda: owner
    response = client.get("/api/governance/audit")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data

    # Case B: Manager accessing Audit logs -> 403
    app.dependency_overrides[get_current_user] = lambda: manager
    response = client.get("/api/governance/audit")
    assert response.status_code == 403

    # Case C: Manager accessing Operational logs -> 200
    response = client.get("/api/governance/operational")
    assert response.status_code == 200

    # Clean up override
    app.dependency_overrides.pop(get_current_user, None)

def test_process_specific_automation_creates_operational_logs(client, db, monkeypatch):
    import core.database
    import modules.automation.service
    from tests.conftest import TestingSessionLocal
    
    monkeypatch.setattr(core.database, "SessionLocal", TestingSessionLocal)
    monkeypatch.setattr(modules.automation.service, "SessionLocal", TestingSessionLocal)

    # Execute automation processing (e.g. daily_recommendations)
    run_system_job("daily_recommendations")

    # Verify that an OperationalLog has been written (skip or run)
    log = db.query(OperationalLog).filter(OperationalLog.job_id == "sys_daily_recommendations").filter(OperationalLog.event_name == "daily_recommendations_SUCCESS").first()
    assert log is not None
    assert log.log_type == "SYSTEM_JOB"
    assert log.status == "SUCCESS"

def test_log_audit_event_on_create_visit(client, db):
    owner = setup_user_with_subscription(db, "owner_visit_audit", "STARTER")

    app.dependency_overrides[get_current_user] = lambda: owner

    response = client.post("/api/visits/", json={
        "phone_number": "5559876543",
        "name": "Audit Visit Guest",
        "amount": 99.99,
        "send_sms": False
    })
    assert response.status_code == 200

    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_visit_audit",
        AuditLog.action == "CREATE_VISIT"
    ).first()
    assert log is not None
    assert log.status == "SUCCESS"
    assert log.entity_type == "Visit"
    assert float(log.metadata_json["amount"]) == pytest.approx(99.99)

    app.dependency_overrides.pop(get_current_user, None)

def test_log_audit_event_on_login(client, db):
    owner = setup_user_with_subscription(db, "owner_login_audit", "STARTER")

    # Success Login
    response = client.post("/api/auth/login", json={
        "username": "owner_login_audit",
        "password": "password"
    })
    assert response.status_code == 200

    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_login_audit",
        AuditLog.action == "LOGIN",
        AuditLog.status == "SUCCESS"
    ).first()
    assert log is not None

    # Failed Login
    response = client.post("/api/auth/login", json={
        "username": "owner_login_audit",
        "password": "wrong_password"
    })
    assert response.status_code == 401

    log_fail = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_login_audit",
        AuditLog.action == "LOGIN",
        AuditLog.status == "FAILED"
    ).first()
    assert log_fail is not None

def test_log_audit_event_on_logout(client, db):
    owner = setup_user_with_subscription(db, "owner_logout_audit", "STARTER")

    app.dependency_overrides[get_current_user] = lambda: owner

    response = client.post("/api/auth/logout")
    assert response.status_code == 200

    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_logout_audit",
        AuditLog.action == "LOGOUT"
    ).first()
    assert log is not None
    assert log.status == "SUCCESS"

    app.dependency_overrides.pop(get_current_user, None)

def test_log_audit_event_on_change_password(client, db):
    owner = setup_user_with_subscription(db, "owner_pwd_audit", "STARTER")

    app.dependency_overrides[get_current_user] = lambda: owner

    # Success change password
    response = client.post("/api/auth/change-password", json={
        "current_password": "password",
        "new_password": "newpassword"
    })
    assert response.status_code == 200

    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_pwd_audit",
        AuditLog.action == "CHANGE_PASSWORD",
        AuditLog.status == "SUCCESS"
    ).first()
    assert log is not None

    # Fail change password
    response = client.post("/api/auth/change-password", json={
        "current_password": "wrong_password",
        "new_password": "newpassword"
    })
    assert response.status_code == 400

    log_fail = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_pwd_audit",
        AuditLog.action == "CHANGE_PASSWORD",
        AuditLog.status == "FAILED"
    ).first()
    assert log_fail is not None

    app.dependency_overrides.pop(get_current_user, None)

def test_log_audit_event_on_subscription_change(client, db):
    owner = setup_user_with_subscription(db, "owner_sub_audit", "STARTER")

    # Ensure plan "GROWTH" is seeded
    seed_plans(db)

    app.dependency_overrides[get_current_user] = lambda: owner

    response = client.post("/api/auth/subscription", json={
        "plan_name": "GROWTH"
    })
    assert response.status_code == 200

    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_sub_audit",
        AuditLog.action == "CHANGE_SUBSCRIPTION"
    ).first()
    assert log is not None
    assert log.status == "SUCCESS"
    assert log.metadata_json["plan_name"] == "GROWTH"

    app.dependency_overrides.pop(get_current_user, None)

def test_log_audit_event_on_settings_update(client, db):
    owner = setup_user_with_subscription(db, "owner_settings_audit", "STARTER")

    app.dependency_overrides[get_current_user] = lambda: owner

    response = client.post("/api/settings/", json={
        "review_message_template": "Hello {name}!",
        "auto_send_sms": False,
        "campaign_inactive_days": 45
    })
    assert response.status_code == 200

    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_settings_audit",
        AuditLog.action == "UPDATE_SETTINGS"
    ).first()
    assert log is not None
    assert log.status == "SUCCESS"
    assert log.metadata_json["review_message_template"] == "Hello {name}!"
    assert log.metadata_json["auto_send_sms"] is False

    app.dependency_overrides.pop(get_current_user, None)

def test_log_audit_event_on_customer_update(client, db):
    owner = setup_user_with_subscription(db, "owner_cust_audit", "STARTER")

    cust = Customer(name="Old Name", phone_number="5551112222")
    db.add(cust)
    db.commit()
    db.refresh(cust)

    app.dependency_overrides[get_current_user] = lambda: owner

    response = client.patch(f"/api/customers/{cust.id}", json={
        "name": "New Name"
    })
    assert response.status_code == 200

    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_cust_audit",
        AuditLog.action == "UPDATE_CUSTOMER"
    ).first()
    assert log is not None
    assert log.status == "SUCCESS"
    assert log.metadata_json["changed_fields"]["name"]["old"] == "Old Name"
    assert log.metadata_json["changed_fields"]["name"]["new"] == "New Name"

    app.dependency_overrides.pop(get_current_user, None)

def test_log_audit_event_on_loyalty_actions(client, db):
    owner = setup_user_with_subscription(db, "owner_loyalty_audit", "GROWTH")

    app.dependency_overrides[get_current_user] = lambda: owner

    # 1. CREATE_REWARD
    response = client.post("/api/loyalty/rewards", json={
        "name": "Free Soda",
        "reward_type": "milestone",
        "required_visits": 5,
        "is_active": True
    })
    assert response.status_code == 200
    reward_id = response.json()["id"]

    log_create = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_loyalty_audit",
        AuditLog.action == "CREATE_REWARD"
    ).first()
    assert log_create is not None
    assert log_create.status == "SUCCESS"

    # 2. UPDATE_REWARD
    response = client.patch(f"/api/loyalty/rewards/{reward_id}", json={
        "name": "Free Super Soda"
    })
    assert response.status_code == 200

    log_update = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_loyalty_audit",
        AuditLog.action == "UPDATE_REWARD"
    ).first()
    assert log_update is not None
    assert log_update.status == "SUCCESS"

    # 3. REDEEM_REWARD
    cust = Customer(name="Loyal Guest", phone_number="5559998888")
    db.add(cust)
    db.commit()
    db.refresh(cust)

    from modules.loyalty.models import LoyaltyProgress
    prog = LoyaltyProgress(customer_id=cust.id, lifetime_visits=10)
    db.add(prog)
    db.commit()

    response = client.post(f"/api/loyalty/redeem/{cust.id}/{reward_id}")
    assert response.status_code == 200

    log_redeem = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_loyalty_audit",
        AuditLog.action == "REDEEM_REWARD"
    ).first()
    assert log_redeem is not None
    assert log_redeem.status == "SUCCESS"

    app.dependency_overrides.pop(get_current_user, None)

def test_log_audit_event_on_send_campaign(client, db, monkeypatch):
    owner = setup_user_with_subscription(db, "owner_campaign_audit", "GROWTH")

    # Mock execute_campaign to avoid sending SMS/hitting DB
    import modules.messaging.service
    monkeypatch.setattr(modules.messaging.service, "execute_campaign", lambda *args, **kwargs: {"sent_count": 5, "failed_count": 0})

    app.dependency_overrides[get_current_user] = lambda: owner

    response = client.post("/api/messages/campaign", json={
        "message": "Come back!",
        "audience_type": "all",
        "inactive_days": 30
    })
    assert response.status_code == 200

    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_campaign_audit",
        AuditLog.action == "SEND_CAMPAIGN"
    ).first()
    assert log is not None
    assert log.status == "SUCCESS"
    assert log.metadata_json["sent_count"] == 5

    app.dependency_overrides.pop(get_current_user, None)

def test_log_audit_event_on_automation_update(client, db):
    owner = setup_user_with_subscription(db, "owner_auto_audit", "PRO")

    app.dependency_overrides[get_current_user] = lambda: owner

    # 1. Update automation message template (UPDATE_AUTOMATION)
    response = client.post("/api/automation/", json={
        "automation_type": "birthday",
        "message_template": "Happy Day {name}!"
    })
    assert response.status_code == 200

    log = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_auto_audit",
        AuditLog.action == "UPDATE_AUTOMATION"
    ).first()
    assert log is not None
    assert log.status == "SUCCESS"

    # 2. Toggle automation (TOGGLE_AUTOMATION)
    response = client.post("/api/automation/", json={
        "automation_type": "birthday",
        "is_enabled": False
    })
    assert response.status_code == 200

    log_toggle = db.query(AuditLog).filter(
        AuditLog.actor_username == "owner_auto_audit",
        AuditLog.action == "TOGGLE_AUTOMATION"
    ).first()
    assert log_toggle is not None
    assert log_toggle.status == "SUCCESS"

    app.dependency_overrides.pop(get_current_user, None)

def test_governance_api_subscription_gating(client, db):
    # Setup owner on STARTER subscription (gated out of governance feature)
    owner = setup_user_with_subscription(db, "owner_starter_gated", "STARTER")

    app.dependency_overrides[get_current_user] = lambda: owner

    # Should be 403 Forbidden for Audit Log retrieval
    response = client.get("/api/governance/audit")
    assert response.status_code == 403

    # Should be 403 Forbidden for Operational Log retrieval
    response = client.get("/api/governance/operational")
    assert response.status_code == 403

    app.dependency_overrides.pop(get_current_user, None)
