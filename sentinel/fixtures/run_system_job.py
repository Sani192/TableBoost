import os
import sys

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend')))

os.environ["TESTING"] = "1"
if not os.environ.get("DATABASE_URL"):
    os.environ["DATABASE_URL"] = "sqlite:///" + os.path.abspath(os.path.join(os.path.dirname(__file__), '../sentinel_test.db'))

import main  # Ensures all models are imported and registered before mappers initialize
from modules.automation.service import run_system_job

if len(sys.argv) < 2:
    print("Usage: python run_system_job.py <job_type>")
    sys.exit(1)

job_type = sys.argv[1]
print(f"Running system job: {job_type}")
try:
    run_system_job(job_type)
    print("Job completed successfully.")
except Exception as e:
    print(f"Job failed: {e}", file=sys.stderr)
    sys.exit(1)
