from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings
import time
import logging

logger = logging.getLogger(__name__)

# Resilient connection initialization
MAX_RETRIES = 5
RETRY_DELAY_SEC = 2

for attempt in range(1, MAX_RETRIES + 1):
    try:
        engine = create_engine(settings.DATABASE_URL)
        # Attempt to connect
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection established successfully.")
        break
    except Exception as e:
        logger.warning(f"Database connection failed (Attempt {attempt}/{MAX_RETRIES}): {e}")
        if attempt < MAX_RETRIES:
            logger.info(f"Retrying in {RETRY_DELAY_SEC} seconds...")
            time.sleep(RETRY_DELAY_SEC)
        else:
            logger.error("FATAL: Could not connect to the database after maximum retries.")
            raise

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_default_restaurant_id():
    import os
    if os.environ.get("TESTING") == "1":
        return 1
    return None
