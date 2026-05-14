from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from modules.visits.router import router as visits_router
from modules.dashboard.router import router as dashboard_router
from modules.settings.router import router as settings_router
from modules.customers.router import router as customers_router
from modules.messaging.router import router as messaging_router
from modules.loyalty.router import router as loyalty_router
from modules.automation.router import router as automation_router
from apscheduler.schedulers.background import BackgroundScheduler
from modules.automation import service as automation_service
from modules.messaging import service as messaging_service
from core.database import SessionLocal

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

# Scheduler Setup
scheduler = BackgroundScheduler()

def run_daily_jobs():
    db = SessionLocal()
    try:
        automation_service.process_daily_automations(db)
    finally:
        db.close()

def run_hourly_jobs():
    db = SessionLocal()
    try:
        messaging_service.process_scheduled_campaigns(db)
    finally:
        db.close()

scheduler.add_job(run_daily_jobs, 'cron', hour=9, minute=0) # Run at 9 AM daily
scheduler.add_job(run_hourly_jobs, 'interval', hours=1) # Run every hour
scheduler.start()

@app.get("/")
def read_root():
    return {"message": "Welcome to TableBoost API Phase 1"}
