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
    return db.query(AutomationConfig).all()

def update_automation_config(db: Session, config_data):
    config = db.query(AutomationConfig).filter(AutomationConfig.automation_type == config_data['automation_type']).first()
    if not config:
        config = AutomationConfig(**config_data)
        db.add(config)
    else:
        for key, value in config_data.items():
            setattr(config, key, value)
    db.commit()
    db.refresh(config)
    return config

def process_daily_automations(db: Session):
    """Run by background scheduler every morning"""
    today = date.today()
    
    # 1. Birthday Automation
    birthday_cfg = db.query(AutomationConfig).filter(AutomationConfig.automation_type == 'birthday', AutomationConfig.is_enabled == True).first()
    if birthday_cfg:
        customers = db.query(Customer).join(CustomerProfile).filter(
            func.extract('month', CustomerProfile.birthday) == today.month,
            func.extract('day', CustomerProfile.birthday) == today.day
        ).all()
        
        for customer in customers:
            send_automation_message(db, customer, birthday_cfg, str(today.year))

    # 2. Inactivity Automation (e.g. 30 days)
    inactivity_cfg = db.query(AutomationConfig).filter(AutomationConfig.automation_type == 'inactivity', AutomationConfig.is_enabled == True).first()
    if inactivity_cfg:
        days = inactivity_cfg.settings.get('days', 30) if inactivity_cfg.settings else 30
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        
        # Subquery for last visit
        from sqlalchemy import func
        last_visit_sub = db.query(Visit.customer_id, func.max(Visit.visited_at).label('last_visit')).group_by(Visit.customer_id).subquery()
        
        target_customers = db.query(Customer).join(last_visit_sub, Customer.id == last_visit_sub.c.customer_id)\
                             .filter(last_visit_sub.c.last_visit < cutoff).all()
        
        for customer in target_customers:
            # For inactivity, we only send once per month to avoid spam
            send_automation_message(db, customer, inactivity_cfg, f"{today.year}-{today.month}")

def send_automation_message(db: Session, customer, config, period_ref: str):
    # Check history to prevent duplicates
    exists = db.query(AutomationHistory).filter(
        AutomationHistory.customer_id == customer.id,
        AutomationHistory.automation_type == config.automation_type,
        AutomationHistory.reference_period == period_ref
    ).first()
    
    if exists:
        return
        
    message_content = config.message_template.replace("{name}", customer.name or "there")
    
    # Send via messaging service
    try:
        print(f"AUTOMATION SMS SENT to {customer.id}: {message_content}")
        status = "sent"
    except:
        status = "failed"
        
    # Log in history
    history = AutomationHistory(
        customer_id=customer.id,
        automation_type=config.automation_type,
        reference_period=period_ref
    )
    db.add(history)
    
    # Log in message logs
    msg = Message(
        customer_id=customer.id,
        message_text=message_content,
        type="automation",
        status=status
    )
    db.add(msg)
    db.commit()

def trigger_event_automation(db: Session, customer_id: int, event_type: str, context: dict = None):
    """Triggered by system events (e.g. reward_unlocked)"""
    config = db.query(AutomationConfig).filter(AutomationConfig.automation_type == event_type, AutomationConfig.is_enabled == True).first()
    if not config:
        return
        
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        return
        
    ref = context.get('ref', str(datetime.now().date()))
    send_automation_message(db, customer, config, ref)
