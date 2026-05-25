import pytest
from fastapi.testclient import TestClient
from main import app
from core.database import get_db
from modules.auth.router import get_current_user
from modules.users.models import User
from modules.restaurants.models import Restaurant, RestaurantUser
from modules.subscriptions.models import Subscription
from modules.settings.models import Setting
from modules.automation.models import AutomationConfig
from modules.loyalty.models import LoyaltyReward

# Setup helper to override get_current_user with SUPER_ADMIN
def get_super_admin():
    return User(id=100, username="platform_admin", role="SUPER_ADMIN", is_active=True)

def get_owner_user():
    return User(id=101, username="testowner", role="OWNER", is_active=True)

def test_provision_endpoint_requires_super_admin(client: TestClient):
    # Default conftest mock returns OWNER, should get 403
    payload = {
        "restaurant_name": "Unauthorised Bistro",
        "timezone": "UTC",
        "owner_username": "unauth_owner",
        "owner_password": "password123",
        "plan_name": "PRO",
        "dryRun": True
    }
    response = client.post("/internal/admin/provision-restaurant", json=payload)
    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]

def test_validate_endpoint_requires_super_admin(client: TestClient):
    response = client.get("/internal/admin/validate-restaurant?restaurant_id=1")
    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]

def test_successful_provisioning_and_validation(client: TestClient, db):
    # Override conftest to allow SUPER_ADMIN
    app.dependency_overrides[get_current_user] = get_super_admin
    
    try:
        payload = {
            "restaurant_name": "Gourmet Garden",
            "timezone": "America/New_York",
            "owner_username": "garden_owner",
            "owner_password": "password123",
            "plan_name": "PRO",
            "dryRun": False
        }
        
        # 1. Provision
        response = client.post("/internal/admin/provision-restaurant", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["dryRun"] is False
        assert data["restaurant_name"] == "Gourmet Garden"
        assert data["owner_username"] == "garden_owner"
        assert data["manager_username"] == "garden_owner_manager"
        assert data["staff_username"] == "garden_owner_staff"
        assert data["plan_assigned"] == "PRO"
        assert len(data["actions_taken"]) > 0
        
        restaurant_id = data["restaurant_id"]
        assert restaurant_id is not None
        
        # 2. Check Database records are correct
        # Restaurant exists
        rest = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
        assert rest is not None
        assert rest.name == "Gourmet Garden"
        assert rest.timezone == "America/New_York"
        
        # Subscription exists
        sub = db.query(Subscription).filter(Subscription.restaurant_id == restaurant_id).first()
        assert sub is not None
        assert sub.plan.name == "PRO"
        assert sub.status == "ACTIVE"
        
        # Users and mappings exist
        for role, username in [("OWNER", "garden_owner"), ("MANAGER", "garden_owner_manager"), ("STAFF", "garden_owner_staff")]:
            user = db.query(User).filter(User.username == username).first()
            assert user is not None
            assert user.role == role
            
            link = db.query(RestaurantUser).filter(RestaurantUser.user_id == user.id, RestaurantUser.restaurant_id == restaurant_id).first()
            assert link is not None
            
        # Settings exist
        settings = db.query(Setting).filter(Setting.restaurant_id == restaurant_id).all()
        assert len(settings) == 3
        
        # Automations exist
        automations = db.query(AutomationConfig).filter(AutomationConfig.restaurant_id == restaurant_id).all()
        assert len(automations) == 4
        
        # Loyalty Rewards exist
        loyalty_rewards = db.query(LoyaltyReward).filter(LoyaltyReward.restaurant_id == restaurant_id).all()
        assert len(loyalty_rewards) == 2
        
        # 3. Validate endpoint
        val_response = client.get(f"/internal/admin/validate-restaurant?restaurant_id={restaurant_id}")
        assert val_response.status_code == 200
        val_data = val_response.json()
        assert val_data["status"] == "healthy"
        assert val_data["restaurant_id"] == restaurant_id
        assert val_data["details"]["restaurant_exists"] is True
        assert val_data["details"]["owner_exists"] is True
        assert val_data["details"]["subscription_active"] is True
        assert val_data["details"]["subscription_plan"] == "PRO"
        assert val_data["details"]["settings_count"] == 3
        assert val_data["details"]["automations_count"] == 4
        assert val_data["details"]["loyalty_rewards_count"] == 2
        
    finally:
        # Clear override
        app.dependency_overrides.clear()

def test_dry_run_leaves_db_untouched(client: TestClient, db):
    app.dependency_overrides[get_current_user] = get_super_admin
    
    try:
        payload = {
            "restaurant_name": "Dry Run Diner",
            "timezone": "America/Los_Angeles",
            "owner_username": "diner_owner",
            "owner_password": "password123",
            "plan_name": "STARTER",
            "dryRun": True
        }
        
        response = client.post("/internal/admin/provision-restaurant", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["dryRun"] is True
        assert data["restaurant_id"] is None
        
        # Verify Diner does not exist
        rest = db.query(Restaurant).filter(Restaurant.name == "Dry Run Diner").first()
        assert rest is None
        
        # Verify Diner Owner does not exist
        user = db.query(User).filter(User.username == "diner_owner").first()
        assert user is None
        
    finally:
        app.dependency_overrides.clear()

def test_idempotency_secondary_run(client: TestClient, db):
    app.dependency_overrides[get_current_user] = get_super_admin
    
    try:
        payload = {
            "restaurant_name": "Unique Bistro",
            "timezone": "UTC",
            "owner_username": "unique_owner",
            "owner_password": "password123",
            "plan_name": "PRO",
            "dryRun": False
        }
        
        # Run 1
        res1 = client.post("/internal/admin/provision-restaurant", json=payload)
        assert res1.status_code == 200
        rest_id = res1.json()["restaurant_id"]
        
        # Run 2 with same data
        res2 = client.post("/internal/admin/provision-restaurant", json=payload)
        assert res2.status_code == 200
        assert res2.json()["restaurant_id"] == rest_id
        
        # Verify no duplicate restaurant
        rests = db.query(Restaurant).filter(Restaurant.name == "Unique Bistro").all()
        assert len(rests) == 1
        
    finally:
        app.dependency_overrides.clear()

def test_invalid_timezone(client: TestClient):
    app.dependency_overrides[get_current_user] = get_super_admin
    try:
        payload = {
            "restaurant_name": "Bad TZ Café",
            "timezone": "Not/A_Real_Timezone",
            "owner_username": "bad_owner",
            "owner_password": "password123",
            "plan_name": "STARTER",
            "dryRun": False
        }
        response = client.post("/internal/admin/provision-restaurant", json=payload)
        assert response.status_code == 400
        assert "Invalid timezone" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()

def test_username_must_be_globally_unique(client: TestClient):
    # "testowner" exists from conftest.py
    app.dependency_overrides[get_current_user] = get_super_admin
    try:
        payload = {
            "restaurant_name": "Duplicate Owner Grill",
            "timezone": "UTC",
            "owner_username": "testowner",
            "owner_password": "password123",
            "plan_name": "PRO",
            "dryRun": False
        }
        response = client.post("/internal/admin/provision-restaurant", json=payload)
        assert response.status_code == 400
        assert "Username 'testowner' already exists" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()
