import pytest
from fastapi.testclient import TestClient
from main import app
from modules.users.models import User, UserProfile
from modules.auth.service import create_access_token
from modules.users.service import get_password_hash

def test_get_profile_creates_profile_on_fly(client, db):
    # 1. Create a user without a profile
    user = User(
        username="testuser",
        password_hash=get_password_hash("password"),
        role="OWNER",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # 2. Override get_current_user
    from modules.auth.router import get_current_user
    app.dependency_overrides[get_current_user] = lambda: user
    
    # 3. Call GET /api/auth/profile
    response = client.get("/api/auth/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] is None
    assert data["last_name"] is None
    assert data["id"] is not None
    
    # 4. Verify user was updated with profile_id
    assert user.profile_id == data["id"]
    
    # Clean up override
    app.dependency_overrides.pop(get_current_user, None)

def test_update_profile(client, db):
    # 1. Create a user
    user = User(
        username="testuser2",
        password_hash=get_password_hash("password"),
        role="OWNER",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # 2. Override get_current_user
    from modules.auth.router import get_current_user
    app.dependency_overrides[get_current_user] = lambda: user
    
    # 3. Call GET to create profile
    client.get("/api/auth/profile")
    
    # 4. Call PUT to update profile
    response = client.put("/api/auth/profile", json={
        "first_name": "Alice",
        "last_name": "Smith"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == "Alice"
    assert data["last_name"] == "Smith"
    
    # 5. Verify in DB
    db.refresh(user)
    profile = db.query(UserProfile).filter(UserProfile.id == user.profile_id).first()
    assert profile.first_name == "Alice"
    assert profile.last_name == "Smith"
    
    # Clean up override
    app.dependency_overrides.pop(get_current_user, None)

def test_update_subscription(client, db):
    # 1. Create a user
    user = User(
        username="testuser3",
        password_hash=get_password_hash("password"),
        role="OWNER",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # 2. Override get_current_user
    from modules.auth.router import get_current_user
    app.dependency_overrides[get_current_user] = lambda: user
    
    # 3. Call POST /api/auth/subscription
    response = client.post("/api/auth/subscription", json={
        "plan_name": "PRO"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["plan"] == "PRO"
    assert "automation" in data["features"]
    
    # Clean up override
    app.dependency_overrides.pop(get_current_user, None)
