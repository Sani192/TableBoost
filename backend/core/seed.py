"""
Centralized, idempotent database seeding.

This module is called by prestart.py on every deployment.
All operations are safe to run repeatedly — they only insert
data that doesn't already exist.
"""
import os
import logging
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def seed_plans(db: Session) -> None:
    """Seed subscription plans, features, and plan-feature mappings."""
    from modules.subscriptions.registry import seed_plans as _seed_plans
    _seed_plans(db)
    logger.info("Subscription plans seeded.")


def seed_super_admin(db: Session) -> None:
    """Seed the default SUPER_ADMIN platform operator if not present."""
    from modules.users.models import User
    from modules.users.service import get_password_hash

    existing = db.query(User).filter(User.role == "SUPER_ADMIN").first()
    if existing:
        logger.info("SUPER_ADMIN already exists — skipping.")
        return

    password = os.environ.get("SUPER_ADMIN_PASSWORD", "superadmin123")
    super_admin = User(
        username="superadmin",
        password_hash=get_password_hash(password),
        role="SUPER_ADMIN",
        is_active=True,
    )
    db.add(super_admin)
    db.commit()
    logger.info("SUPER_ADMIN seeded successfully.")


def run_seed() -> None:
    """Execute all seeding operations. Safe to call on every deployment."""
    from core.database import SessionLocal, import_all_models
    import_all_models()

    db = SessionLocal()
    try:
        logger.info("Running database seeding...")
        seed_plans(db)
        seed_super_admin(db)
        logger.info("All seeding complete.")
    except Exception as e:
        logger.error(f"Seeding failed: {e}", exc_info=True)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )
    run_seed()
