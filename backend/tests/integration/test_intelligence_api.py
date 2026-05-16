import pytest
from fastapi.testclient import TestClient
from main import app
from core.database import Base, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta, timezone

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_intel.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_intelligence_kpis_not_null():
    """Verify that intelligence data is correctly exposed in the dashboard response."""
    # Add some data
    client.post("/api/visits/", json={"phone_number": "1112223333", "amount": 100.0, "name": "VIP User", "send_sms": False})
    
    response = client.get("/api/dashboard/")
    assert response.status_code == 200
    data = response.json()
    
    # Intelligence objects should be present
    assert "revenue" in data
    assert data["revenue"] is not None
    assert "segments" in data
    assert data["segments"] is not None
    
    # Check specific fields
    assert "weekly_total" in data["revenue"]
    assert "daily_trends" in data["revenue"]
    assert len(data["revenue"]["daily_trends"]) == 7
    assert "vips_count" in data["segments"]

def test_daily_trends_gap_filling():
    """Verify that all 7 days are represented in daily trends even with gaps."""
    response = client.get("/api/dashboard/")
    data = response.json()
    
    trends = data["revenue"]["daily_trends"]
    assert len(trends) == 7
    for day in trends:
        assert "date" in day
        assert "revenue" in day
        assert "visits" in day

def test_vip_logic_top_10_percent():
    """Verify VIP logic follows top 10% rule."""
    # Add 10 customers, 1 spender
    for i in range(10):
        phone = f"555000{i:04d}"
        amount = 1000.0 if i == 0 else 10.0
        client.post("/api/visits/", json={"phone_number": phone, "amount": amount, "name": f"User {i}", "send_sms": False})
        
    response = client.get("/api/dashboard/")
    data = response.json()
    
    # Top 10% of 10 is 1
    assert data["segments"]["vips_count"] == 1
