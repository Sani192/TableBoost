from sqlalchemy.orm import Session
from sqlalchemy import func
from modules.customers.models import Customer
from modules.visits.models import Visit
from typing import Optional

def get_customers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    min_visits: Optional[int] = None,
    max_visits: Optional[int] = None,
    min_spent: Optional[float] = None,
    max_spent: Optional[float] = None
):
    query = db.query(
        Customer,
        func.count(Visit.id).label("total_visits"),
        func.max(Visit.visited_at).label("last_visit"),
        func.sum(Visit.amount).label("total_spent")
    ).outerjoin(Visit, Customer.id == Visit.customer_id).group_by(Customer.id)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Customer.name.ilike(search_filter)) |
            (Customer.phone_number.like(search_filter))
        )
        

    if min_visits is not None:
        query = query.having(func.count(Visit.id) >= min_visits)
    if max_visits is not None:
        query = query.having(func.count(Visit.id) <= max_visits)
    if min_spent is not None:
        query = query.having(func.sum(Visit.amount) >= min_spent)
    if max_spent is not None:
        query = query.having(func.sum(Visit.amount) <= max_spent)
        
    query = query.order_by(func.max(Visit.visited_at).desc().nulls_last())

    results = query.offset(skip).limit(limit).all()
    
    response = []
    for customer, total_visits, last_visit, total_spent in results:
        response.append({
            "id": customer.id,
            "phone_number": customer.phone_number,
            "name": customer.name,
            "created_at": customer.created_at,
            "total_visits": total_visits or 0,
            "last_visit": last_visit,
            "total_spent": total_spent or 0.0
        })
    return response

def get_customer_detail(db: Session, customer_id: int):
    customer_info = db.query(
        Customer,
        func.count(Visit.id).label("total_visits"),
        func.max(Visit.visited_at).label("last_visit"),
        func.sum(Visit.amount).label("total_spent")
    ).outerjoin(Visit, Customer.id == Visit.customer_id)\
     .filter(Customer.id == customer_id).group_by(Customer.id).first()
     
    if not customer_info or not customer_info[0]:
        return None
        
    customer, total_visits, last_visit, total_spent = customer_info
    
    return {
        "id": customer.id,
        "phone_number": customer.phone_number,
        "name": customer.name,
        "created_at": customer.created_at,
        "total_visits": total_visits or 0,
        "last_visit": last_visit,
        "total_spent": total_spent or 0.0
    }

def get_customer_visits(db: Session, customer_id: int, skip: int = 0, limit: int = 20):
    visits = db.query(Visit).filter(Visit.customer_id == customer_id).order_by(Visit.visited_at.desc()).offset(skip).limit(limit).all()
    return [{
        "id": v.id,
        "amount": v.amount,
        "visited_at": v.visited_at
    } for v in visits]
