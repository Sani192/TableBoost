from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc
from datetime import datetime, timedelta, timezone
from modules.visits.models import Visit
from modules.customers.models import Customer
from modules.loyalty.models import RewardRedemption

def get_revenue_metrics(db: Session):
    today = datetime.now(timezone.utc)
    
    # 1. Daily Revenue (Last 7 days)
    seven_days_ago = today - timedelta(days=7)
    daily_revenue = db.query(
        func.date(Visit.visited_at).label('date'),
        func.sum(Visit.amount).label('revenue'),
        func.count(Visit.id).label('visit_count')
    ).filter(Visit.visited_at >= seven_days_ago)\
     .group_by(func.date(Visit.visited_at))\
     .order_by(func.date(Visit.visited_at)).all()
     
    # 2. Average Ticket Size
    avg_ticket = db.query(func.avg(Visit.amount)).scalar() or 0
    
    # 3. New vs Repeat Customer Revenue (Last 30 days)
    thirty_days_ago = today - timedelta(days=30)
    
    # Subquery to find first visit date for each customer
    first_visits = db.query(
        Visit.customer_id,
        func.min(Visit.visited_at).label('first_visit_at')
    ).group_by(Visit.customer_id).subquery()
    
    revenue_split = db.query(
        case(
            (Visit.visited_at == first_visits.c.first_visit_at, 'New'),
            else_='Repeat'
        ).label('customer_type'),
        func.sum(Visit.amount).label('total_revenue')
    ).join(first_visits, Visit.customer_id == first_visits.c.customer_id)\
     .filter(Visit.visited_at >= thirty_days_ago)\
     .group_by('customer_type').all()

    # 4. Weekly/Monthly Revenue
    thirty_days_revenue = sum(r[1] for r in daily_revenue) # This is only 7 days, let's get 30
    
    return {
        "daily_trends": [{"date": str(r[0]), "revenue": float(r[1]), "visits": r[2]} for r in daily_revenue],
        "avg_ticket": float(avg_ticket),
        "revenue_split": {r[0]: float(r[1]) for r in revenue_split},
        "monthly_total": sum(float(r[1]) for r in revenue_split)
    }

def get_customer_segments(db: Session):
    # VIPs (Top 10% spenders)
    # Get total spent per customer
    total_spent_sub = db.query(
        Visit.customer_id,
        func.sum(Visit.amount).label('total_amount')
    ).group_by(Visit.customer_id).order_by(desc('total_amount')).subquery()
    
    vips = db.query(Customer).join(total_spent_sub, Customer.id == total_spent_sub.c.customer_id)\
             .order_by(desc(total_spent_sub.c.total_amount)).limit(50).all() # Simplified "Top" for now
             
    # At-Risk (No visits in 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    last_visits = db.query(
        Visit.customer_id,
        func.max(Visit.visited_at).label('last_visit')
    ).group_by(Visit.customer_id).subquery()
    
    at_risk = db.query(Customer).join(last_visits, Customer.id == last_visits.c.customer_id)\
                .filter(last_visits.c.last_visit < thirty_days_ago).limit(50).all()

    return {
        "vips_count": len(vips),
        "at_risk_count": len(at_risk)
    }
