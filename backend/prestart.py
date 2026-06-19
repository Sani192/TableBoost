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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("prestart")


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

    run_migrations()
    run_seeding()

    logger.info("========================================")
    logger.info("  Pre-start complete. Ready to launch.")
    logger.info("========================================")


if __name__ == "__main__":
    main()
