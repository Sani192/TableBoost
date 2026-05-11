from sqlalchemy.orm import Session
from sqlalchemy import func
from modules.customers.models import Customer
from modules.visits.models import Visit
from typing import Optional

def get_customers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
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
    
    visits = db.query(Visit).filter(Visit.customer_id == customer_id).order_by(Visit.visited_at.desc()).all()
    
    visit_list = [{
        "id": v.id,
        "amount": v.amount,
        "visited_at": v.visited_at
    } for v in visits]
    
    return {
        "id": customer.id,
        "phone_number": customer.phone_number,
        "name": customer.name,
        "created_at": customer.created_at,
        "total_visits": total_visits or 0,
        "last_visit": last_visit,
        "total_spent": total_spent or 0.0,
        "visits": visit_list
    }
