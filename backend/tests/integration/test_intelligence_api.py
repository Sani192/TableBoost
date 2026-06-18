import pytest
from fastapi.testclient import TestClient
from main import app
from core.database import Base, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta, timezone

# Using shared fixtures from conftest.py

def test_intelligence_kpis_not_null(client):
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

def test_daily_trends_gap_filling(client):
    """Verify that all 7 days are represented in daily trends even with gaps."""
    response = client.get("/api/dashboard/")
    data = response.json()
    
    trends = data["revenue"]["daily_trends"]
    assert len(trends) == 7
    for day in trends:
        assert "date" in day
        assert "revenue" in day
        assert "visits" in day

def test_vip_logic_top_20_percent(client, db):
    """Verify VIP logic follows top 20% rule."""
    # Add 10 customers, 1 spender
    for i in range(10):
        phone = f"555000{i:04d}"
        amount = 1000.0 if i == 0 else 10.0
        client.post("/api/visits/", json={"phone_number": phone, "amount": amount, "name": f"User {i}", "send_sms": False})
        
    from modules.intelligence.service import compute_daily_intelligence
    compute_daily_intelligence(db)

    response = client.get("/api/dashboard/")
    data = response.json()
    
    # Top 20% of 10 is 2
    assert data["segments"]["vips_count"] == 2
