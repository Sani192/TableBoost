"""
Pre-start script for deployment on Render.com (or any platform).

This script runs BEFORE the application starts and handles:
  1. Database schema migrations (alembic upgrade head)
  2. Data seeding (plans, features, super_admin)

Usage:
  python prestart.py

Exit codes:
  0 — success, app is ready to launch
  1 — failure, deployment should be aborted
"""
import subprocess
import sys
import logging

import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("prestart")


def auto_stamp_if_existing() -> None:
    """Detect if the database already has tables from a previous setup but lacks the 0001 stamp.

    If tables (e.g. 'user_profiles') exist, stamp it with version '0001' so Alembic knows
    the squashed migration is already applied and doesn't try to recreate existing tables.
    """
    logger.info("=== Checking database state for auto-stamping ===")
    from sqlalchemy import create_engine, inspect, text
    from core.config import settings

    try:
        engine = create_engine(settings.DATABASE_URL)
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        if "user_profiles" in tables:
            logger.info("Existing tables detected. Ensuring database is stamped with version '0001'...")
            with engine.begin() as conn:
                conn.execute(text(
                    "CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL PRIMARY KEY)"
                ))
                # Check current stamp
                result = conn.execute(text("SELECT version_num FROM alembic_version")).fetchone()
                if not result:
                    conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('0001')"))
                    logger.info("Database stamped with version '0001' (fresh stamp).")
                elif result[0] != "0001":
                    conn.execute(text("UPDATE alembic_version SET version_num = '0001'"))
                    logger.info(f"Database stamp updated from '{result[0]}' to '0001'.")
                else:
                    logger.info("Database is already stamped with version '0001'.")
        else:
            logger.info("Fresh database detected (no existing tables). Skipping auto-stamping.")
    except Exception as e:
        logger.warning(f"Auto-stamping check skipped or failed: {e}. Alembic will run normally.")


def run_migrations() -> None:
    """Run alembic upgrade head to apply all pending migrations."""
    logger.info("=== Running database migrations ===")
    result = subprocess.run(
        [sys.executable, "-m", "alembic", "upgrade", "head"],
        capture_output=True,
        text=True,
    )
    if result.stdout:
        logger.info(result.stdout.strip())
    if result.returncode != 0:
        logger.error(f"Migration failed (exit code {result.returncode}):")
        logger.error(result.stderr)
        sys.exit(1)
    logger.info("Migrations applied successfully.")


def run_seeding() -> None:
    """Run idempotent data seeding."""
    logger.info("=== Running database seeding ===")
    from core.seed import run_seed
    run_seed()


def main() -> None:
    logger.info("========================================")
    logger.info("  TableBoost Pre-Start")
    logger.info("========================================")

    auto_stamp_if_existing()
    run_migrations()
    run_seeding()

    logger.info("========================================")
    logger.info("  Pre-start complete. Ready to launch.")
    logger.info("========================================")


if __name__ == "__main__":
    main()
