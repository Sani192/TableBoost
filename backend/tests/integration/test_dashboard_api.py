import pytest
from fastapi.testclient import TestClient
from main import app
from core.database import Base, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
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

def test_get_dashboard_empty():
    response = client.get("/api/dashboard/")
    assert response.status_code == 200
    data = response.json()
    assert data["total_customers"] == 0
    assert data["total_visits"] == 0
    assert data["repeat_customers"] == 0
    assert data["recent_visits"] == []

def test_get_dashboard_with_data():
    # Add a visit
    client.post("/api/visits/", json={
        "phone_number": "1234567890",
        "name": "John Doe",
        "amount": 50.0,
        "send_sms": False
    })
    
    # Add second visit for same user (repeat)
    client.post("/api/visits/", json={
        "phone_number": "1234567890",
        "amount": 25.0,
        "send_sms": False
    })
    
    # Add another user
    client.post("/api/visits/", json={
        "phone_number": "0987654321",
        "name": "Jane Doe",
        "send_sms": False
    })
    
    response = client.get("/api/dashboard/")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_customers"] == 2
    assert data["total_visits"] == 3
    assert data["repeat_customers"] == 1
    assert len(data["recent_visits"]) == 3
    
    # Check recent visits contain correct data
    phone_numbers = [v["phone_number"] for v in data["recent_visits"]]
    assert "0987654321" in phone_numbers
    assert phone_numbers.count("1234567890") == 2
