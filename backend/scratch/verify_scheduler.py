import sys
import os
sys.path.append(os.path.join(os.getcwd(), "backend"))

from core.scheduler import scheduler
from core.database import SessionLocal
from modules.automation import service as automation_service

def check_scheduler():
    db = SessionLocal()
    try:
        # Re-sync to simulate startup
        automation_service.sync_scheduler(scheduler, db)
        
        jobs = scheduler.get_jobs()
        print(f"Total Jobs: {len(jobs)}")
        for job in jobs:
            print(f"- ID: {job.id}")
            
        has_campaign = any(j.id == "campaign_job" for j in jobs)
        has_autos = any(j.id.startswith("auto_") for j in jobs)
        
        print(f"Has campaign job: {has_campaign}")
        print(f"Has auto jobs: {has_autos}")
        
        assert has_campaign
        assert has_autos
        print("Scheduler validation PASSED.")
    finally:
        db.close()

if __name__ == "__main__":
    check_scheduler()
