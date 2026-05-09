import logging
from sqlalchemy.orm import Session
from backend.modules.customers.models import Customer
from backend.modules.visits.models import Visit
from backend.modules.visits.schemas import VisitCreate
from backend.modules.messaging import service as messaging_service
from backend.modules.settings import service as settings_service

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
    
    # Attach status for response schema
    new_visit.sms_status = sms_status
    
    return new_visit

