from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from modules.visits.router import router as visits_router
from modules.dashboard.router import router as dashboard_router
from modules.settings.router import router as settings_router
from modules.customers.router import router as customers_router
from modules.messaging.router import router as messaging_router
from modules.loyalty.router import router as loyalty_router
from modules.automation.router import router as automation_router
from modules.intelligence.router import router as intelligence_router
from modules.auth.router import router as auth_router
from modules.governance.router import router as governance_router
from modules.automation import service as automation_service
from modules.messaging import service as messaging_service
from core.database import SessionLocal
from core.scheduler import scheduler
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
# Ensure the automation service logger is also at INFO level
logging.getLogger('modules.automation.service').setLevel(logging.INFO)

app = FastAPI(title="TableBoost API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(visits_router)
app.include_router(dashboard_router)
app.include_router(settings_router)
app.include_router(customers_router)
app.include_router(messaging_router)
app.include_router(loyalty_router)
app.include_router(automation_router)
app.include_router(intelligence_router)
app.include_router(auth_router)
app.include_router(governance_router)

# Initial job registration

# Initial job registration
db = SessionLocal()
try:
    logger.info("Syncing scheduler with database configurations...")
    automation_service.sync_scheduler(scheduler, db)
finally:
    db.close()

from apscheduler.events import EVENT_JOB_EXECUTED, EVENT_JOB_ERROR, EVENT_JOB_MISSED

def scheduler_listener(event):
    from core.database import SessionLocal
    from modules.governance.service import log_operational_event
    db = SessionLocal()
    try:
        job_id = event.job_id
        if event.code == EVENT_JOB_EXECUTED:
            log_operational_event(
                db,
                log_type="SCHEDULER",
                event_name="JOB_EXECUTED",
                job_id=job_id,
                status="SUCCESS",
                message=f"Scheduler job {job_id} executed successfully."
            )
        elif event.code == EVENT_JOB_ERROR:
            log_operational_event(
                db,
                log_type="SCHEDULER",
                event_name="JOB_ERROR",
                job_id=job_id,
                status="FAILED",
                message=f"Scheduler job {job_id} raised an exception: {event.exception}",
                metadata_json={"exception": str(event.exception), "traceback": str(event.traceback)}
            )
        elif event.code == EVENT_JOB_MISSED:
            log_operational_event(
                db,
                log_type="SCHEDULER",
                event_name="JOB_MISSED",
                job_id=job_id,
                status="FAILED",
                message=f"Scheduler job {job_id} was missed."
            )
    except Exception as e:
        logger.error(f"Error in scheduler event listener: {e}", exc_info=True)
    finally:
        db.close()

scheduler.add_listener(scheduler_listener, EVENT_JOB_EXECUTED | EVENT_JOB_ERROR | EVENT_JOB_MISSED)

logger.info("Starting background scheduler...")
scheduler.start()

# Log scheduled jobs
logger.info("=== Scheduled Jobs ===")
for job in scheduler.get_jobs():
    logger.info(f"- Job ID: {job.id}, Trigger: {job.trigger}")
logger.info("=======================")

@app.get("/")
def read_root():
    return {"message": "Welcome to TableBoost API"}
