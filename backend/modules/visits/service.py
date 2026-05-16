import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from modules.customers.models import Customer, CustomerProfile
from modules.visits.models import Visit
from modules.visits.schemas import VisitCreate
from modules.messaging import service as messaging_service
from modules.settings import service as settings_service
from modules.loyalty import service as loyalty_service
from modules.automation import service as automation_service

logger = logging.getLogger(__name__)

def add_visit(db: Session, visit_data: VisitCreate):
    # 1. Find or create customer
    customer = db.query(Customer).filter(Customer.phone_number == visit_data.phone_number).first()
    
    if not customer:
        customer = Customer(
            phone_number=visit_data.phone_number,
            name=visit_data.name
        )
        db.add(customer)
        db.flush() # Flush to get ID without committing transaction yet
        
        if visit_data.birthday or visit_data.anniversary:
            profile = CustomerProfile(
                customer_id=customer.id,
                birthday=visit_data.birthday,
                anniversary=visit_data.anniversary
            )
            db.add(profile)
    elif visit_data.name:
        customer.name = visit_data.name
        db.add(customer)

    # 2. Record visit
    new_visit = Visit(
        customer_id=customer.id,
        amount=visit_data.amount
    )
    db.add(new_visit)
    db.flush() # Ensure visit ID is available if needed

    # 2.5 Update Loyalty Progress
    loyalty_service.update_loyalty_progress(db, customer.id)
    
    # 3. Handle Review SMS — per-visit override takes priority over global setting
    should_send = visit_data.send_sms
    if should_send is None:
        should_send = settings_service.get_setting(db, "auto_send_sms", default=True)
    
    sms_status = "skipped"
    if should_send:
        try:
            sms_status = messaging_service.trigger_review_sms(db, customer.id, customer.name)
        except Exception as e:
            logger.error(f"Failed to trigger review SMS for customer {customer.id}: {e}", exc_info=True)
            sms_status = "failed"
    
    # 4. Final Commit
    db.commit()
    db.refresh(new_visit)
    
    # Trigger visit_created automation
    automation_service.trigger_event_automation(db, customer.id, 'visit_created', {'ref': f"visit_{new_visit.id}"})
    
    # Attach status for response schema
    new_visit.sms_status = sms_status
    
    return new_visit

def get_visits(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    sort_by: str = "visited_at",
    sort_order: str = "desc"
):
    query = db.query(Visit, Customer).join(Customer)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Customer.name.ilike(search_filter)) |
            (Customer.phone_number.like(search_filter))
        )

    if start_date:
        query = query.filter(Visit.visited_at >= start_date)
    if end_date:
        # Make end_date inclusive of the full day if no time is provided
        # or just ensure it covers up to the end of that specific datetime
        if end_date.hour == 0 and end_date.minute == 0:
            from datetime import timedelta
            end_date = end_date + timedelta(days=1) - timedelta(seconds=1)
        query = query.filter(Visit.visited_at <= end_date)

    if min_amount is not None:
        query = query.filter(Visit.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Visit.amount <= max_amount)

    # Sorting
    model_attr = None
    if sort_by == "amount":
        model_attr = Visit.amount
    elif sort_by == "name":
        model_attr = Customer.name
    else:
        model_attr = Visit.visited_at

    if sort_order == "asc":
        query = query.order_by(model_attr.asc())
    else:
        query = query.order_by(model_attr.desc())

    results = query.offset(skip).limit(limit).all()
    
    # Map results to include customer info
    visits = []
    for visit, customer in results:
        visits.append({
            "id": visit.id,
            "customer_id": visit.customer_id,
            "customer_name": customer.name,
            "phone_number": customer.phone_number,
            "amount": visit.amount,
            "visited_at": visit.visited_at,
            "sms_status": getattr(visit, 'sms_status', None)
        })
        
    return visits
