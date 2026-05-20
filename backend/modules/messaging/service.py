import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc, func, exists
from modules.messaging.models import Message, Campaign
from modules.customers.models import Customer
from modules.visits.models import Visit
from modules.loyalty.models import LoyaltyProgress, LoyaltyReward
from modules.settings import service as settings_service

logger = logging.getLogger(__name__)

DEFAULT_TEMPLATE = "Hi {name}, thanks for visiting! Please leave us a review: https://g.page/r/example/review"

def trigger_review_sms(db: Session, customer_id: int, customer_name: str = None):
    # Read template from settings, fall back to default
    template = settings_service.get_setting(db, "review_message_template", default=DEFAULT_TEMPLATE)
    message_content = template.replace("{name}", customer_name or "there")

    # Attempt to send SMS (placeholder for actual gateway)
    try:
        print(f"SMS SENT to customer {customer_id}: {message_content}")
        status = "sent"
    except Exception as e:
        logger.error(f"SMS gateway failed for customer {customer_id}: {e}", exc_info=True)
        status = "failed"

    # Always log the message in the database
    new_message = Message(
        customer_id=customer_id,
        message_text=message_content,
        type="review",
        status=status,
    )
    db.add(new_message)
    db.flush()

    return status

def get_messages(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    search: str = None,
    log_type: str = None,
    status: str = None,
    start_date: datetime = None,
    end_date: datetime = None
):
    query = db.query(Message, Customer).join(Customer)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Customer.name.ilike(search_filter)) |
            (Customer.phone_number.like(search_filter))
        )
        
    if log_type:
        query = query.filter(Message.type == log_type)
        
    if status:
        query = query.filter(Message.status == status)
        
    if start_date:
        query = query.filter(Message.sent_at >= start_date)
        
    if end_date:
        query = query.filter(Message.sent_at <= end_date)
        
    results = query.order_by(Message.sent_at.desc()).offset(skip).limit(limit).all()
    
    formatted_results = []
    for msg, cust in results:
        formatted_results.append({
            "id": msg.id,
            "customer_id": msg.customer_id,
            "customer_name": cust.name,
            "phone_number": cust.phone_number,
            "message_text": msg.message_text,
            "type": msg.type,
            "status": msg.status,
            "sent_at": msg.sent_at
        })
    return formatted_results

def execute_campaign(db: Session, message_template: str, audience_type: str, inactive_days: int = None):
    if audience_type == "all":
        customers = db.query(Customer).all()
    elif audience_type == "inactive":
        if inactive_days is None:
            inactive_days = int(settings_service.get_setting(db, "campaign_inactive_days", default=30))
        
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=inactive_days)
        subquery = db.query(Visit.customer_id).filter(Visit.visited_at >= cutoff_date).subquery()
        customers = db.query(Customer).outerjoin(subquery, Customer.id == subquery.c.customer_id).filter(subquery.c.customer_id == None).all()
    elif audience_type == "vip":
        # Top 10% spenders
        total_customers = db.query(Customer).count()
        vip_limit = max(1, int(total_customers * 0.1))
        
        total_spent_sub = db.query(
            Visit.customer_id,
            func.sum(Visit.amount).label('total_amount')
        ).group_by(Visit.customer_id).order_by(desc('total_amount')).subquery()
        
        customers = db.query(Customer).join(total_spent_sub, Customer.id == total_spent_sub.c.customer_id)\
                 .order_by(desc(total_spent_sub.c.total_amount)).limit(vip_limit).all()
    elif audience_type == "reward_near":
        # Within 2 visits of any active milestone reward (including boundary)
        subq = db.query(LoyaltyReward).filter(
            LoyaltyReward.reward_type == 'milestone',
            LoyaltyReward.is_active == True,
            LoyaltyReward.required_visits - LoyaltyProgress.lifetime_visits <= 2,
            LoyaltyReward.required_visits - LoyaltyProgress.lifetime_visits >= 0
        ).exists()
        
        customers = db.query(Customer).join(LoyaltyProgress, Customer.id == LoyaltyProgress.customer_id).filter(subq).all()
    else:
        raise ValueError(f"Invalid audience_type: {audience_type}")

    sent_count = 0
    failed_count = 0
    
    from modules.messaging.models import Campaign
    campaign = Campaign(
        name=f"Campaign {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')}",
        message_template=message_template,
        audience_type=audience_type,
        status="completed",
    )
    db.add(campaign)
    db.flush() # Get campaign ID
    
    for customer in customers:
        message_content = message_template.replace("{name}", customer.name or "there")
        try:
            print(f"CAMPAIGN SMS SENT to customer {customer.id}: {message_content}")
            status = "sent"
            sent_count += 1
        except Exception as e:
            logger.error(f"Campaign SMS failed for customer {customer.id}: {e}", exc_info=True)
            status = "failed"
            failed_count += 1
            
        new_message = Message(
            customer_id=customer.id,
            campaign_id=campaign.id,
            message_text=message_content,
            type="campaign",
            status=status,
        )
        db.add(new_message)
        
    db.commit()
    
    return {"sent_count": sent_count, "failed_count": failed_count, "total": sent_count + failed_count}

def process_scheduled_campaigns(db: Session):
    now = datetime.now(timezone.utc)
    # Find scheduled campaigns that are ready to send
    campaigns = db.query(Campaign).filter(
        Campaign.status == 'scheduled',
        Campaign.scheduled_at <= now
    ).all()
    
    if not campaigns:
        return
        
    # Gate under 'campaigns' subscription feature
    from modules.subscriptions.registry import check_job_feature_access
    if not check_job_feature_access(db, "campaigns"):
        logger.warning("Skipping scheduled campaigns processing - subscription plan does not allow campaigns.")
        return
        
    for camp in campaigns:
        try:
            results = execute_campaign(db, camp.message_template, camp.audience_type)
            camp.status = 'completed'
            logger.info(f"Campaign {camp.id} completed: {results}")
        except Exception as e:
            camp.status = 'failed'
            logger.error(f"Campaign {camp.id} failed: {e}")
            
    db.commit()

from modules.messaging.models import Message, Campaign
