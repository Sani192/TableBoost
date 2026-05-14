"""
Shared test fixtures for TableBoost backend tests.

Provides:
  - In-memory SQLite test database with all tables created
  - Per-test DB session with automatic rollback isolation
  - FastAPI TestClient wired to the test database
  - Factory fixtures for Customer, Visit, Setting, and Message records
"""

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from core.database import Base, get_db
from main import app

# Import all models so Base.metadata registers every table
from modules.customers.models import Customer  # noqa: F401
from modules.visits.models import Visit  # noqa: F401
from modules.messaging.models import Message  # noqa: F401
from modules.settings.models import Setting  # noqa: F401
from modules.loyalty.models import LoyaltyReward, LoyaltyProgress, RewardRedemption  # noqa: F401


# ---------------------------------------------------------------------------
# Test database engine (in-memory SQLite, shared across connections)
# ---------------------------------------------------------------------------
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=test_engine
)


# ---------------------------------------------------------------------------
# Enable SQLite foreign key enforcement (disabled by default)
# ---------------------------------------------------------------------------
@event.listens_for(test_engine, "connect")
def _enable_sqlite_fks(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture(autouse=True)
def setup_tables():
    """Create all tables before each test, drop after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db():
    """Yield a clean SQLAlchemy session for unit tests."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


@pytest.fixture
def client(db):
    """
    FastAPI TestClient with get_db overridden to use the test session.
    Shares the same session as the `db` fixture so unit-test seeded data
    is visible to integration-test HTTP requests.
    """
    def _override_get_db():
        try:
            yield db
        finally:
            pass  # session lifecycle managed by the `db` fixture

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Factory fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def create_customer(db):
    """Factory: insert a Customer row and return it."""
    def _create(phone_number="5551234567", name=None):
        customer = Customer(phone_number=phone_number, name=name)
        db.add(customer)
        db.flush()
        return customer
    return _create


@pytest.fixture
def create_visit(db, create_customer):
    """Factory: insert a Visit row (creates customer if needed)."""
    def _create(phone_number="5551234567", name=None, amount=None, customer=None):
        if customer is None:
            customer = create_customer(phone_number=phone_number, name=name)
        visit = Visit(customer_id=customer.id, amount=amount)
        db.add(visit)
        db.flush()
        return visit, customer
    return _create


@pytest.fixture
def create_setting(db):
    """Factory: insert a Setting row."""
    def _create(key, value_str=None, value_bool=None):
        setting = Setting(key=key, value_str=value_str, value_bool=value_bool)
        db.add(setting)
        db.flush()
        return setting
    return _create


@pytest.fixture
def create_message(db):
    """Factory: insert a Message row."""
    def _create(customer_id, message_text="test", msg_type="review", status="sent"):
        message = Message(
            customer_id=customer_id,
            message_text=message_text,
            type=msg_type,
            status=status,
        )
        db.add(message)
        db.flush()
        return message
    return _create
