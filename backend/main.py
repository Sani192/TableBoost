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
from provisioning import provisioning_router
from modules.restaurants.models import Restaurant, RestaurantUser
from modules.automation import service as automation_service
from modules.messaging import service as messaging_service
from core.database import SessionLocal
from core.scheduler import scheduler
import logging
from core.middleware import CorrelationIdMiddleware, get_correlation_id

# Configure logging with correlation ID filter
class CorrelationIdFilter(logging.Filter):
    def filter(self, record):
        record.correlation_id = get_correlation_id()
        return True

log_handler = logging.StreamHandler()
log_handler.setFormatter(logging.Formatter('%(asctime)s - [%(correlation_id)s] - %(name)s - %(levelname)s - %(message)s'))
log_handler.addFilter(CorrelationIdFilter())

# Clear default logging handlers and setup correlation logging
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
for h in root_logger.handlers[:]:
    root_logger.removeHandler(h)
root_logger.addHandler(log_handler)

logger = logging.getLogger(__name__)
# Ensure the automation service logger is also at INFO level
logging.getLogger('modules.automation.service').setLevel(logging.INFO)

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from fastapi.exceptions import RequestValidationError
from core.errors import TableBoostError

app = FastAPI(title="TableBoost API", version="1.0.0")

# Register CorrelationIdMiddleware first
app.add_middleware(CorrelationIdMiddleware)

@app.exception_handler(TableBoostError)
async def tableboost_exception_handler(request: Request, exc: TableBoostError):
    correlation_id = getattr(request.state, "correlation_id", "-")
    logger.error(f"TableBoostError [{exc.status_code}]: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.message,
            "detail": exc.message,
            "payload": exc.payload,
            "type": exc.__class__.__name__,
            "correlation_id": correlation_id
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    correlation_id = getattr(request.state, "correlation_id", "-")
    logger.error(f"HTTPException [{exc.status_code}]: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": True,
            "message": exc.detail,
            "detail": exc.detail,
            "payload": {},
            "type": "HTTPException",
            "correlation_id": correlation_id
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    correlation_id = getattr(request.state, "correlation_id", "-")
    errors = exc.errors()
    error_msgs = []
    for err in errors:
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg", "invalid value")
        error_msgs.append(f"{loc}: {msg}")
    
    friendly_message = "Validation failed: " + "; ".join(error_msgs)
    logger.warning(f"RequestValidationError: {friendly_message}")
    
    # Sanitize Pydantic error dictionaries to ensure JSON serializability
    sanitized_errors = []
    for err in errors:
        new_err = {}
        for k, v in err.items():
            if k == "ctx" and isinstance(v, dict):
                new_ctx = {}
                for ck, cv in v.items():
                    if isinstance(cv, Exception):
                        new_ctx[ck] = str(cv)
                    else:
                        new_ctx[ck] = cv
                new_err[k] = new_ctx
            else:
                new_err[k] = v
        sanitized_errors.append(new_err)
    
    return JSONResponse(
        status_code=422,
        content={
            "error": True,
            "message": friendly_message,
            "detail": friendly_message,
            "payload": {"details": sanitized_errors},
            "type": "ValidationError",
            "correlation_id": correlation_id
        }
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    correlation_id = getattr(request.state, "correlation_id", "-")
    logger.error(f"Unhandled Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": True,
            "message": "An internal operational error occurred.",
            "detail": "An internal operational error occurred.",
            "type": "InternalServerError",
            "correlation_id": correlation_id
        }
    )

import os
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def normalize_trailing_slash(request: Request, call_next):
    path = request.url.path
    if path != "/" and path.endswith("/"):
        # Modify the scope path internally to prevent 307 redirects
        request.scope["path"] = path.rstrip("/")
    return await call_next(request)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# Simple global rate limiter for general API abuse protection
from collections import defaultdict
import time
from fastapi import HTTPException, status

global_rate_limit = defaultdict(list)
GLOBAL_RATE_LIMIT_MAX = 200 # requests
GLOBAL_RATE_LIMIT_WINDOW = 60 # per minute

@app.middleware("http")
async def global_rate_limiter(request: Request, call_next):
    # Exclude health check and static assets from rate limiting
    if request.url.path.startswith("/api/health"):
        return await call_next(request)
        
    ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    global_rate_limit[ip] = [t for t in global_rate_limit[ip] if current_time - t < GLOBAL_RATE_LIMIT_WINDOW]
    
    if len(global_rate_limit[ip]) >= GLOBAL_RATE_LIMIT_MAX:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"error": True, "message": "Too many requests. Please slow down."}
        )
        
    global_rate_limit[ip].append(current_time)
    return await call_next(request)

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
app.include_router(provisioning_router)

import os
import sys

def startup_validation():
    # 1. Environment validation
    if os.getenv("ENVIRONMENT") == "production":
        from core.config import settings
        if settings.SECRET_KEY == "your-super-secret-key-change-in-production":
            logger.error("FATAL: Default SECRET_KEY is used in production. Halting startup.")
            sys.exit(1)
        if not os.getenv("ALLOWED_ORIGINS") or os.getenv("ALLOWED_ORIGINS") == "http://localhost:3000":
            logger.warning("WARNING: ALLOWED_ORIGINS is not properly configured for production.")

# Run startup validations before launching the application
startup_validation()

@app.get("/api/health")
def health_check():
    """Deep health check for operational visibility."""
    # Check DB Connectivity
    db_status = "ok"
    try:
        from sqlalchemy import text
        db = SessionLocal()
        db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Health check DB error: {e}")
        db_status = "error"
    finally:
        db.close()

    # Scheduler Health
    scheduler_status = "ok" if scheduler.running else "stopped"

    is_healthy = db_status == "ok" and scheduler_status == "ok"
    return JSONResponse(
        status_code=200 if is_healthy else 503,
        content={
            "status": "ok" if is_healthy else "degraded",
            "database": db_status,
            "scheduler_running": scheduler_status,
            "scheduler_jobs": len(scheduler.get_jobs())
        }
    )
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
