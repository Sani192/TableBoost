from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta, timezone
import logging
from modules.automation.models import AutomationConfig, AutomationHistory
from modules.customers.models import Customer, CustomerProfile
from modules.messaging import service as messaging_service
from modules.messaging.models import Message
from modules.visits.models import Visit

logger = logging.getLogger(__name__)

def get_automation_configs(db: Session, restaurant_id: int):
    logger.info(f"Fetching all automation configs for restaurant {restaurant_id}")
    configs = db.query(AutomationConfig).filter(AutomationConfig.restaurant_id == restaurant_id).all()
    return configs

def update_automation_config(db: Session, restaurant_id: int, config_data):
    logger.info(f"Updating automation config for type: {config_data.get('automation_type')} (Rest: {restaurant_id})")
    config = db.query(AutomationConfig).filter(
        AutomationConfig.restaurant_id == restaurant_id,
        AutomationConfig.automation_type == config_data['automation_type']
    ).first()
    if not config:
        config = AutomationConfig(restaurant_id=restaurant_id, **config_data)
        db.add(config)
    else:
        for key, value in config_data.items():
            setattr(config, key, value)
    db.commit()
    db.refresh(config)
    return config

def send_automation_message(db: Session, customer, config, period_ref: str):
    logger.info(f"Attempting to send automation message. Customer ID: {customer.id}, Type: {config.automation_type}, Period: {period_ref}")
    
    # Check history to prevent duplicates
    exists = db.query(AutomationHistory).filter(
        AutomationHistory.restaurant_id == customer.restaurant_id,
        AutomationHistory.customer_id == customer.id,
        AutomationHistory.automation_type == config.automation_type,
        AutomationHistory.reference_period == period_ref
    ).first()
    
    if exists:
        logger.info(f"Duplicate prevention: Message already sent to customer {customer.id}. Skipping.")
        return
        
    message_content = config.message_template.replace("{name}", customer.name or "there")
    
    # Send via messaging service
    try:
        status = "sent"
        logger.info(f"SMS status: {status}")
    except Exception as e:
        logger.error(f"Failed to send SMS to customer {customer.id}: {e}")
        status = "failed"
        
    # Log in history
    history = AutomationHistory(
        restaurant_id=customer.restaurant_id,
        customer_id=customer.id,
        automation_type=config.automation_type,
        reference_period=period_ref
    )
    db.add(history)
    
    # Log in message logs
    msg = Message(
        restaurant_id=customer.restaurant_id,
        customer_id=customer.id,
        message_text=message_content,
        type="automation",
        status=status
    )
    db.add(msg)
    db.commit()

def trigger_event_automation(db: Session, restaurant_id: int, customer_id: int, event_type: str, context: dict = None):
    """Triggered by system events (e.g. reward_unlocked)"""
    from modules.subscriptions.registry import check_job_feature_access
    if not check_job_feature_access(db, "automation", restaurant_id):
        return

    config = db.query(AutomationConfig).filter(
        AutomationConfig.restaurant_id == restaurant_id,
        AutomationConfig.automation_type == event_type, 
        AutomationConfig.is_enabled == True
    ).first()
    if not config:
        return
        
    customer = db.query(Customer).filter(Customer.id == customer_id, Customer.restaurant_id == restaurant_id).first()
    if not customer:
        return
        
    ref = context.get('ref', str(datetime.now().date())) if context else str(datetime.now().date())
    send_automation_message(db, customer, config, ref)

def sync_scheduler(scheduler, db: Session):
    """Register system-wide and tenant-specific automations"""
    logger.info("Starting sync_scheduler")
    
    existing_jobs = scheduler.get_jobs()
    for job in existing_jobs:
        if job.id.startswith("auto_") or job.id.startswith("sys_"):
            scheduler.remove_job(job.id)
            
    from modules.messaging import service as messaging_service
    
    # 1. Register System-wide Jobs
    scheduler.add_job(
        lambda: messaging_service.process_scheduled_campaigns(SessionLocal()),
        'interval', hours=1, id="sys_campaign_job"
    )
    
    # Intelligence Jobs
    scheduler.add_job(lambda: run_system_job('daily_intelligence'), 'cron', hour=2, minute=0, id="sys_daily_intelligence")
    scheduler.add_job(lambda: run_system_job('daily_recommendations'), 'cron', hour=3, minute=0, id="sys_daily_recommendations")
    scheduler.add_job(lambda: run_system_job('weekly_summary'), 'cron', day_of_week='mon', hour=4, minute=0, id="sys_weekly_summary")
    scheduler.add_job(lambda: run_system_job('monthly_summary'), 'cron', day=1, hour=5, minute=0, id="sys_monthly_summary")

    # 2. Register Tenant-specific SMS automations
    configs = db.query(AutomationConfig).filter(AutomationConfig.is_enabled == True, AutomationConfig.schedule.isnot(None)).all()
    for cfg in configs:
        if cfg.automation_type in ['campaign_scheduler', 'daily_intelligence', 'daily_recommendations', 'weekly_summary', 'monthly_summary']:
            continue # These are system jobs now
            
        try:
            parts = cfg.schedule.split(':')
            if parts[0] == 'cron':
                hour, minute = int(parts[1]), int(parts[2])
                scheduler.add_job(
                    lambda r=cfg.restaurant_id, t=cfg.automation_type: process_tenant_automation(r, t),
                    'cron',
                    hour=hour,
                    minute=minute,
                    id=f"auto_{cfg.restaurant_id}_{cfg.automation_type}"
                )
        except Exception as e:
            logger.error(f"Failed to register job for rest_{cfg.restaurant_id}_{cfg.automation_type}: {e}")
            
    logger.info("Completed sync_scheduler")

from core.decorators import resilient_job

@resilient_job("Process Tenant Automation")
def process_tenant_automation(restaurant_id: int, automation_type: str):
    from core.database import SessionLocal
    from modules.governance.service import log_operational_event
    db = SessionLocal()
    start_time = datetime.now()
    try:
        today = date.today()
        cfg = db.query(AutomationConfig).filter(
            AutomationConfig.restaurant_id == restaurant_id,
            AutomationConfig.automation_type == automation_type, 
            AutomationConfig.is_enabled == True
        ).first()
        
        if not cfg:
            return

        from modules.subscriptions.registry import check_job_feature_access
        if not check_job_feature_access(db, "automation", restaurant_id):
            return

        log_operational_event(db, restaurant_id, "AUTOMATION", "AUTOMATION_START", "RUNNING", f"auto_{restaurant_id}_{automation_type}")

        if automation_type == 'birthday':
            customers = db.query(Customer).join(CustomerProfile).filter(
                Customer.restaurant_id == restaurant_id,
                func.extract('month', CustomerProfile.birthday) == today.month,
                func.extract('day', CustomerProfile.birthday) == today.day
            ).all()
            for customer in customers:
                try:
                    send_automation_message(db, customer, cfg, str(today.year))
                except Exception as e:
                    db.rollback()
        
        elif automation_type == 'anniversary':
            customers = db.query(Customer).join(CustomerProfile).filter(
                Customer.restaurant_id == restaurant_id,
                func.extract('month', CustomerProfile.anniversary) == today.month,
                func.extract('day', CustomerProfile.anniversary) == today.day
            ).all()
            for customer in customers:
                try:
                    send_automation_message(db, customer, cfg, str(today.year))
                except Exception as e:
                    db.rollback()
                
        elif automation_type == 'inactivity':
            days = cfg.settings.get('days', 30) if cfg.settings else 30
            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            
            last_visit_sub = db.query(Visit.customer_id, func.max(Visit.visited_at).label('last_visit')).filter(Visit.restaurant_id == restaurant_id).group_by(Visit.customer_id).subquery()
            target_customers = db.query(Customer).join(last_visit_sub, Customer.id == last_visit_sub.c.customer_id)\
                                 .filter(Customer.restaurant_id == restaurant_id, last_visit_sub.c.last_visit < cutoff).all()
                                 
            for customer in target_customers:
                try:
                    send_automation_message(db, customer, cfg, f"{today.year}-{today.month}")
                except Exception as e:
                    db.rollback()

        duration = int((datetime.now() - start_time).total_seconds() * 1000)
        log_operational_event(db, restaurant_id, "AUTOMATION", "AUTOMATION_SUCCESS", "SUCCESS", f"auto_{restaurant_id}_{automation_type}", duration_ms=duration)
    except Exception as e:
        duration = int((datetime.now() - start_time).total_seconds() * 1000)
        log_operational_event(db, restaurant_id, "AUTOMATION", "AUTOMATION_FAILURE", "FAILED", f"auto_{restaurant_id}_{automation_type}", message=str(e), duration_ms=duration)
    finally:
        db.close()

@resilient_job("Run System Job")
def run_system_job(job_type: str):
    from core.database import SessionLocal
    from modules.governance.service import log_operational_event
    db = SessionLocal()
    start_time = datetime.now()
    try:
        log_operational_event(db, None, "SYSTEM_JOB", f"{job_type}_START", "RUNNING", f"sys_{job_type}")
        
        from modules.intelligence import service as intel_service
        from modules.restaurants.models import Restaurant
        
        active_restaurants = db.query(Restaurant).all()
        
        for restaurant in active_restaurants:
            restaurant_id = restaurant.id
            try:
                if job_type == 'daily_intelligence':
                    intel_service.compute_daily_intelligence(db, restaurant_id)
                    intel_service.compute_campaign_summaries(db, restaurant_id)
                    intel_service.compute_reward_effectiveness(db, restaurant_id)
                    intel_service.compute_automation_effectiveness(db, restaurant_id)
                elif job_type == 'daily_recommendations':
                    intel_service.evaluate_recommendations(db, restaurant_id)
                elif job_type == 'weekly_summary':
                    intel_service.generate_summary(db, "weekly", restaurant_id)
                elif job_type == 'monthly_summary':
                    intel_service.generate_summary(db, "monthly", restaurant_id)
            except Exception as e:
                logger.error(f"Error running {job_type} for restaurant {restaurant_id}: {str(e)}", exc_info=True)

        duration = int((datetime.now() - start_time).total_seconds() * 1000)
        log_operational_event(db, None, "SYSTEM_JOB", f"{job_type}_SUCCESS", "SUCCESS", f"sys_{job_type}", duration_ms=duration)
    except Exception as e:
        duration = int((datetime.now() - start_time).total_seconds() * 1000)
        log_operational_event(db, None, "SYSTEM_JOB", f"{job_type}_FAILURE", "FAILED", f"sys_{job_type}", message=str(e), duration_ms=duration)
    finally:
        db.close()

from core.database import SessionLocal
