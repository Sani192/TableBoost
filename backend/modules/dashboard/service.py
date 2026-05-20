from sqlalchemy.orm import Session
from sqlalchemy import func
from modules.customers.models import Customer
from modules.visits.models import Visit
from modules.loyalty import service as loyalty_service
from modules.analytics import service as analytics_service
from modules.intelligence.models import CustomerIntelligence

def get_dashboard_stats(db: Session, has_loyalty: bool = True, has_intel: bool = True):
    total_customers = db.query(Customer).count()
    total_visits = db.query(Visit).count()
    subquery = db.query(Visit.customer_id, func.count(Visit.id).label('visit_count')).group_by(Visit.customer_id).subquery()
    repeat_customers = db.query(subquery).filter(subquery.c.visit_count > 1).count()
    
    # Loyalty stats
    total_redeemed = loyalty_service.get_total_redemption_count(db) if has_loyalty else 0
    celebrations = loyalty_service.get_today_celebrations(db) if has_loyalty else {"birthdays": 0, "anniversaries": 0}
    
    # Revenue & Segments
    revenue_metrics = analytics_service.get_revenue_metrics(db)
    segments = analytics_service.get_customer_segments(db)
    
    # Recent visits (last 10)
    recent_visits_query = db.query(Visit, Customer, CustomerIntelligence).select_from(Visit).join(Customer, Visit.customer_id == Customer.id).outerjoin(CustomerIntelligence, Customer.id == CustomerIntelligence.customer_id).order_by(Visit.visited_at.desc()).limit(10).all()
    
    recent_visits = []
    for visit, customer, intel in recent_visits_query:
        cust_total_visits = db.query(func.count(Visit.id)).filter(Visit.customer_id == customer.id).scalar() or 0
        total_spent = db.query(func.sum(Visit.amount)).filter(Visit.customer_id == customer.id).scalar() or 0
        last_visit = db.query(func.max(Visit.visited_at)).filter(Visit.customer_id == customer.id).scalar()
        
        recent_visits.append({
            "customer_id": customer.id,
            "customer_name": customer.name,
            "phone_number": customer.phone_number,
            "visited_at": visit.visited_at,
            "amount": visit.amount,
            "health_status": (intel.health_status if intel else None) if has_intel else None,
            "clv_tier": (intel.clv_tier if intel else None) if has_intel else None,
            "spend_trend": (intel.spend_trend if intel else None) if has_intel else None,
            "total_visits": cust_total_visits,
            "total_spent": float(total_spent),
            "last_visit": last_visit
        })
        
    return {
        "total_customers": total_customers,
        "total_visits": total_visits,
        "repeat_customers": repeat_customers,
        "total_redeemed": total_redeemed,
        "celebrations": celebrations,
        "recent_visits": recent_visits,
        "revenue": revenue_metrics,
        "segments": segments
    }

