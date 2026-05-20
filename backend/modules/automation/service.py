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

def get_automation_configs(db: Session):
    logger.info("Fetching all automation configs")
    configs = db.query(AutomationConfig).all()
    logger.info(f"Found {len(configs)} automation configs")
    for cfg in configs:
        logger.debug(f"Config: {cfg.automation_type}, enabled={cfg.is_enabled}, schedule={cfg.schedule}")
    return configs

def update_automation_config(db: Session, config_data):
    logger.info(f"Updating automation config for type: {config_data.get('automation_type')}")
    logger.debug(f"Update data: {config_data}")
    config = db.query(AutomationConfig).filter(AutomationConfig.automation_type == config_data['automation_type']).first()
    if not config:
        logger.info(f"Creating new config for {config_data['automation_type']}")
        config = AutomationConfig(**config_data)
        db.add(config)
    else:
        logger.info(f"Updating existing config for {config_data['automation_type']}")
        for key, value in config_data.items():
            setattr(config, key, value)
    db.commit()
    db.refresh(config)
    logger.info(f"Config updated successfully: {config.automation_type}")
    return config

def process_daily_automations(db: Session):
    """Run by background scheduler every morning"""
    today = date.today()
    logger.info(f"Starting process_daily_automations for date: {today}")
    
    # 1. Birthday Automation
    logger.info("Checking Birthday Automations")
    birthday_cfg = db.query(AutomationConfig).filter(AutomationConfig.automation_type == 'birthday', AutomationConfig.is_enabled == True).first()
    if birthday_cfg:
        logger.info(f"Birthday automation is enabled. Querying customers for birthday: {today.month}-{today.day}")
        customers = db.query(Customer).join(CustomerProfile).filter(
            func.extract('month', CustomerProfile.birthday) == today.month,
            func.extract('day', CustomerProfile.birthday) == today.day
        ).all()
        
        logger.info(f"Found {len(customers)} customers with birthdays today.")
        for customer in customers:
            try:
                logger.debug(f"Processing birthday for customer ID: {customer.id}, Name: {customer.name}")
                send_automation_message(db, customer, birthday_cfg, str(today.year))
            except Exception as e:
                logger.error(f"Failed to process birthday for customer {customer.id}: {str(e)}", exc_info=True)
                db.rollback()
    else:
        logger.info("Birthday automation is disabled or not configured.")

    # 2. Anniversary Automation
    logger.info("Checking Anniversary Automations")
    anniversary_cfg = db.query(AutomationConfig).filter(AutomationConfig.automation_type == 'anniversary', AutomationConfig.is_enabled == True).first()
    if anniversary_cfg:
        logger.info(f"Anniversary automation is enabled. Querying customers for anniversary: {today.month}-{today.day}")
        customers = db.query(Customer).join(CustomerProfile).filter(
            func.extract('month', CustomerProfile.anniversary) == today.month,
            func.extract('day', CustomerProfile.anniversary) == today.day
        ).all()
        
        logger.info(f"Found {len(customers)} customers with anniversaries today.")
        for customer in customers:
            try:
                logger.debug(f"Processing anniversary for customer ID: {customer.id}, Name: {customer.name}")
                send_automation_message(db, customer, anniversary_cfg, str(today.year))
            except Exception as e:
                logger.error(f"Failed to process anniversary for customer {customer.id}: {str(e)}", exc_info=True)
                db.rollback()
    else:
        logger.info("Anniversary automation is disabled or not configured.")

    # 3. Inactivity Automation (e.g. 30 days)
    logger.info("Checking Inactivity Automations")
    inactivity_cfg = db.query(AutomationConfig).filter(AutomationConfig.automation_type == 'inactivity', AutomationConfig.is_enabled == True).first()
    if inactivity_cfg:
        days = inactivity_cfg.settings.get('days', 30) if inactivity_cfg.settings else 30
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        logger.info(f"Inactivity automation is enabled. Cutoff date: {cutoff} (days: {days})")
        
        # Subquery for last visit
        last_visit_sub = db.query(Visit.customer_id, func.max(Visit.visited_at).label('last_visit')).group_by(Visit.customer_id).subquery()
        
        target_customers = db.query(Customer).join(last_visit_sub, Customer.id == last_visit_sub.c.customer_id)\
                             .filter(last_visit_sub.c.last_visit < cutoff).all()
        
        logger.info(f"Found {len(target_customers)} inactive customers.")
        for customer in target_customers:
            try:
                logger.debug(f"Processing inactivity for customer ID: {customer.id}, Name: {customer.name}")
                # For inactivity, we only send once per month to avoid spam
                send_automation_message(db, customer, inactivity_cfg, f"{today.year}-{today.month}")
            except Exception as e:
                logger.error(f"Failed to process inactivity for customer {customer.id}: {str(e)}", exc_info=True)
                db.rollback()
    else:
        logger.info("Inactivity automation is disabled or not configured.")
    
    logger.info("Completed process_daily_automations")

def send_automation_message(db: Session, customer, config, period_ref: str):
    logger.info(f"Attempting to send automation message. Customer ID: {customer.id}, Type: {config.automation_type}, Period: {period_ref}")
    
    # Check history to prevent duplicates
    exists = db.query(AutomationHistory).filter(
        AutomationHistory.customer_id == customer.id,
        AutomationHistory.automation_type == config.automation_type,
        AutomationHistory.reference_period == period_ref
    ).first()
    
    if exists:
        logger.info(f"Duplicate prevention: Message already sent to customer {customer.id} for {config.automation_type} in period {period_ref}. Skipping.")
        return
        
    message_content = config.message_template.replace("{name}", customer.name or "there")
    logger.debug(f"Generated message content: {message_content}")
    
    # Send via messaging service
    try:
        logger.info(f"Sending SMS to customer {customer.id}...")
        print(f"AUTOMATION SMS SENT to {customer.id}: {message_content}")
        status = "sent"
        logger.info(f"SMS status: {status}")
    except Exception as e:
        logger.error(f"Failed to send SMS to customer {customer.id}: {e}")
        status = "failed"
        
    # Log in history
    logger.info(f"Logging automation history for customer {customer.id}")
    history = AutomationHistory(
        customer_id=customer.id,
        automation_type=config.automation_type,
        reference_period=period_ref
    )
    db.add(history)
    
    # Log in message logs
    logger.info(f"Logging message in logs for customer {customer.id}")
    msg = Message(
        customer_id=customer.id,
        message_text=message_content,
        type="automation",
        status=status
    )
    db.add(msg)
    db.commit()
    logger.info(f"Database changes committed for customer {customer.id}")

def trigger_event_automation(db: Session, customer_id: int, event_type: str, context: dict = None):
    """Triggered by system events (e.g. reward_unlocked)"""
    logger.info(f"Event triggered: {event_type} for customer ID: {customer_id}")
    
    # Gate under 'automation' subscription feature
    from modules.subscriptions.registry import check_job_feature_access
    if not check_job_feature_access(db, "automation"):
        logger.warning(f"Skipping event automation '{event_type}' - subscription plan does not allow automation.")
        return

    if context:
        logger.debug(f"Event context: {context}")
        
    config = db.query(AutomationConfig).filter(AutomationConfig.automation_type == event_type, AutomationConfig.is_enabled == True).first()
    if not config:
        logger.info(f"No enabled config found for event type: {event_type}. Skipping.")
        return
        
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        logger.error(f"Customer not found for ID: {customer_id} during event: {event_type}")
        return
        
    ref = context.get('ref', str(datetime.now().date())) if context else str(datetime.now().date())
    logger.info(f"Proceeding to send message for event {event_type} with reference {ref}")
    send_automation_message(db, customer, config, ref)

def sync_scheduler(scheduler, db: Session):
    """Register all enabled automations with the scheduler"""
    logger.info("Starting sync_scheduler")
    
    # 1. Remove all existing automation/campaign jobs to avoid duplicates
    existing_jobs = scheduler.get_jobs()
    logger.info(f"Current scheduled jobs: {[j.id for j in existing_jobs]}")
    
    removed_count = 0
    for job in existing_jobs:
        if job.id.startswith("auto_") or job.id == "campaign_job":
            scheduler.remove_job(job.id)
            removed_count += 1
    logger.info(f"Removed {removed_count} existing automation/campaign jobs.")
            
    # 2. Load all enabled configs with schedules
    configs = db.query(AutomationConfig).filter(AutomationConfig.is_enabled == True, AutomationConfig.schedule.isnot(None)).all()
    logger.info(f"Found {len(configs)} enabled configs with schedules to register.")
    
    from modules.messaging import service as messaging_service

    for cfg in configs:
        logger.info(f"Processing config: {cfg.automation_type}, Schedule: {cfg.schedule}")
        if cfg.automation_type == 'campaign_scheduler':
            # System campaign job
            try:
                # interval:1
                hours = int(cfg.schedule.split(':')[1])
                logger.info(f"Registering campaign job with interval: {hours} hours")
                scheduler.add_job(
                    lambda: messaging_service.process_scheduled_campaigns(SessionLocal()),
                    'interval',
                    hours=hours,
                    id="campaign_job"
                )
                logger.info(f"Successfully registered campaign scheduler: {cfg.schedule}")
            except Exception as e:
                logger.error(f"Failed to register campaign job: {e}")
            continue

        # Automation Pilot jobs
        try:
            # cron:HH:MM
            parts = cfg.schedule.split(':')
            if parts[0] == 'cron':
                hour, minute = int(parts[1]), int(parts[2])
                logger.info(f"Registering cron job for {cfg.automation_type} at {hour:02d}:{minute:02d}")
                scheduler.add_job(
                    lambda t=cfg.automation_type: process_specific_automation(t),
                    'cron',
                    hour=hour,
                    minute=minute,
                    id=f"auto_{cfg.automation_type}"
                )
                logger.info(f"Successfully registered automation job {cfg.automation_type}: {cfg.schedule}")
            else:
                logger.warning(f"Unknown schedule type for {cfg.automation_type}: {parts[0]}")
        except Exception as e:
            logger.error(f"Failed to register job for {cfg.automation_type}: {e}")
            
    logger.info("Completed sync_scheduler")

from core.decorators import resilient_job

@resilient_job("Process Specific Automation")
def process_specific_automation(automation_type: str):
    """Wrapper for scheduler to run a specific automation type"""
    logger.info(f"==================================================")
    logger.info(f"Job triggered for automation type: {automation_type}")
    from core.database import SessionLocal
    from modules.governance.service import log_operational_event
    from datetime import datetime
    db = SessionLocal()
    start_time = datetime.now()
    try:
        today = date.today()
        logger.info(f"Current date: {today}")
        
        cfg = db.query(AutomationConfig).filter(
            AutomationConfig.automation_type == automation_type, 
            AutomationConfig.is_enabled == True
        ).first()
        
        if not cfg:
            logger.info(f"No enabled config found for {automation_type}. Exiting job.")
            log_operational_event(
                db,
                log_type="AUTOMATION",
                event_name="AUTOMATION_SKIP",
                job_id=f"auto_{automation_type}",
                status="SUCCESS",
                message=f"No enabled config found for {automation_type}. Exiting job."
            )
            return

        # Gate automated SMS-sending pilots under 'automation' subscription
        if automation_type in ['birthday', 'anniversary', 'inactivity']:
            from modules.subscriptions.registry import check_job_feature_access
            if not check_job_feature_access(db, "automation"):
                logger.warning(f"Skipping SMS automation pilot '{automation_type}' - subscription plan does not allow automation.")
                log_operational_event(
                    db,
                    log_type="AUTOMATION",
                    event_name="AUTOMATION_SKIP",
                    job_id=f"auto_{automation_type}",
                    status="SUCCESS",
                    message=f"Skipping SMS automation pilot '{automation_type}' - subscription plan does not allow automation."
                )
                return

        # Log start
        log_operational_event(
            db,
            log_type="AUTOMATION",
            event_name="AUTOMATION_START",
            job_id=f"auto_{automation_type}",
            status="RUNNING",
            message=f"Starting background automation run for {automation_type}."
        )

        logger.info(f"Config found. Message template: '{cfg.message_template}'")

        if automation_type == 'birthday':
            logger.info(f"Querying customers with birthday on {today.month}-{today.day}")
            customers = db.query(Customer).join(CustomerProfile).filter(
                func.extract('month', CustomerProfile.birthday) == today.month,
                func.extract('day', CustomerProfile.birthday) == today.day
            ).all()
            logger.info(f"Found {len(customers)} customers.")
            for customer in customers:
                try:
                    logger.debug(f"Customer ID: {customer.id}, Name: {customer.name}")
                    send_automation_message(db, customer, cfg, str(today.year))
                except Exception as e:
                    logger.error(f"Failed to process birthday for customer {customer.id}: {str(e)}", exc_info=True)
                    db.rollback()
        
        elif automation_type == 'anniversary':
            logger.info(f"Querying customers with anniversary on {today.month}-{today.day}")
            customers = db.query(Customer).join(CustomerProfile).filter(
                func.extract('month', CustomerProfile.anniversary) == today.month,
                func.extract('day', CustomerProfile.anniversary) == today.day
            ).all()
            logger.info(f"Found {len(customers)} customers.")
            for customer in customers:
                try:
                    logger.debug(f"Customer ID: {customer.id}, Name: {customer.name}")
                    send_automation_message(db, customer, cfg, str(today.year))
                except Exception as e:
                    logger.error(f"Failed to process anniversary for customer {customer.id}: {str(e)}", exc_info=True)
                    db.rollback()
                
        elif automation_type == 'inactivity':
            days = cfg.settings.get('days', 30) if cfg.settings else 30
            cutoff = datetime.now(timezone.utc) - timedelta(days=days)
            logger.info(f"Querying customers inactive since {cutoff} (days: {days})")
            
            last_visit_sub = db.query(Visit.customer_id, func.max(Visit.visited_at).label('last_visit')).group_by(Visit.customer_id).subquery()
            target_customers = db.query(Customer).join(last_visit_sub, Customer.id == last_visit_sub.c.customer_id)\
                                 .filter(last_visit_sub.c.last_visit < cutoff).all()
                                 
            logger.info(f"Found {len(target_customers)} customers.")
            for customer in target_customers:
                try:
                    logger.debug(f"Customer ID: {customer.id}, Name: {customer.name}")
                    send_automation_message(db, customer, cfg, f"{today.year}-{today.month}")
                except Exception as e:
                    logger.error(f"Failed to process inactivity for customer {customer.id}: {str(e)}", exc_info=True)
                    db.rollback()
        
        elif automation_type == 'daily_intelligence':
            from modules.intelligence import service as intel_service
            logger.info("Running daily intelligence computations")
            intel_service.compute_daily_intelligence(db)
            intel_service.compute_campaign_summaries(db)
            intel_service.compute_reward_effectiveness(db)
            intel_service.compute_automation_effectiveness(db)
            
        elif automation_type == 'daily_recommendations':
            from modules.intelligence import service as intel_service
            logger.info("Running daily recommendations evaluation")
            intel_service.evaluate_recommendations(db)
            
        elif automation_type == 'weekly_summary':
            if today.weekday() == 0: # Monday
                from modules.intelligence import service as intel_service
                logger.info("Generating weekly summary")
                intel_service.generate_summary(db, "weekly")
            else:
                logger.info("Not Monday, skipping weekly summary")
                
        elif automation_type == 'monthly_summary':
            if today.day == 1:
                from modules.intelligence import service as intel_service
                logger.info("Generating monthly summary")
                intel_service.generate_summary(db, "monthly")
            else:
                logger.info("Not 1st of month, skipping monthly summary")
        
        else:
            logger.warning(f"Unhandled automation type in process_specific_automation: {automation_type}")
            
        # Log success
        duration = int((datetime.now() - start_time).total_seconds() * 1000)
        log_operational_event(
            db,
            log_type="AUTOMATION",
            event_name="AUTOMATION_SUCCESS",
            job_id=f"auto_{automation_type}",
            status="SUCCESS",
            message=f"Successfully completed background automation run for {automation_type}.",
            duration_ms=duration
        )
                
    except Exception as e:
        logger.error(f"Error processing automation {automation_type}: {e}", exc_info=True)
        duration = int((datetime.now() - start_time).total_seconds() * 1000)
        log_operational_event(
            db,
            log_type="AUTOMATION",
            event_name="AUTOMATION_FAILURE",
            job_id=f"auto_{automation_type}",
            status="FAILED",
            message=f"Failed background automation run for {automation_type}: {str(e)}",
            duration_ms=duration,
            metadata_json={"error": str(e)}
        )
    finally:
        db.close()
        logger.info(f"Job completed for automation type: {automation_type}")
        logger.info(f"==================================================")

# Temporary import fix for scheduler registration
from core.database import SessionLocal
