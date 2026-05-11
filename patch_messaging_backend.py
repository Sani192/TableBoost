import os

# 1. Update messaging/service.py
service_path = "backend/modules/messaging/service.py"
with open(service_path, 'r') as f:
    content = f.read()

old_get_messages = """def get_messages(db: Session, skip: int = 0, limit: int = 100):
    messages = db.query(Message).order_by(Message.sent_at.desc()).offset(skip).limit(limit).all()"""

new_get_messages = """def get_messages(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    search: str = None,
    log_type: str = None,
    status: str = None,
    start_date: str = None,
    end_date: str = None
):
    query = db.query(Message)
    
    if search:
        query = query.outerjoin(Customer, Message.customer_id == Customer.id)
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
        
    messages = query.order_by(Message.sent_at.desc()).offset(skip).limit(limit).all()"""

content = content.replace(old_get_messages, new_get_messages)
with open(service_path, 'w') as f:
    f.write(content)

# 2. Update messaging/router.py
router_path = "backend/modules/messaging/router.py"
with open(router_path, 'r') as f:
    content = f.read()

old_router = """@router.get("/", response_model=List[schemas.MessageLogResponse])
def get_message_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return service.get_messages(db, skip=skip, limit=limit)"""

new_router = """from typing import Optional
from datetime import datetime

@router.get("/", response_model=List[schemas.MessageLogResponse])
def get_message_logs(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    return service.get_messages(
        db, 
        skip=skip, 
        limit=limit,
        search=search,
        log_type=type,
        status=status,
        start_date=start_date,
        end_date=end_date
    )"""

content = content.replace(old_router, new_router)
with open(router_path, 'w') as f:
    f.write(content)

print("Messaging backend updated successfully.")
