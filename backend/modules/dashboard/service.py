from sqlalchemy.orm import Session
from sqlalchemy import func
from modules.customers.models import Customer
from modules.visits.models import Visit

def get_dashboard_stats(db: Session):
    total_customers = db.query(Customer).count()
    total_visits = db.query(Visit).count()
    
    # Repeat customers are customers with > 1 visit
    # We can do this by grouping visits by customer_id and counting
    subquery = db.query(Visit.customer_id, func.count(Visit.id).label('visit_count')).group_by(Visit.customer_id).subquery()
    repeat_customers = db.query(subquery).filter(subquery.c.visit_count > 1).count()
    
    # Recent visits (last 10)
    recent_visits_query = db.query(Visit, Customer).join(Customer).order_by(Visit.visited_at.desc()).limit(10).all()
    
    recent_visits = []
    for visit, customer in recent_visits_query:
        recent_visits.append({
            "customer_name": customer.name,
            "phone_number": customer.phone_number,
            "visited_at": visit.visited_at,
            "amount": visit.amount
        })
        
    return {
        "total_customers": total_customers,
        "total_visits": total_visits,
        "repeat_customers": repeat_customers,
        "recent_visits": recent_visits
    }
