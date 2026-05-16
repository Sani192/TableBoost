from sqlalchemy.orm import Session, selectinload
from sqlalchemy import and_, or_, desc, func, exists
from modules.customers.models import Customer, CustomerProfile
from modules.visits.models import Visit
from modules.loyalty.models import LoyaltyProgress, LoyaltyReward
from typing import Optional, List
from datetime import datetime, date, timedelta, timezone

def get_customers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    min_visits: Optional[int] = None,
    max_visits: Optional[int] = None,
    min_spent: Optional[float] = None,
    max_spent: Optional[float] = None,
    birthday_month: Optional[int] = None,
    birthday_day: Optional[int] = None,
    anniversary_month: Optional[int] = None,
    anniversary_day: Optional[int] = None,
    is_celebrating_today: Optional[bool] = None,
    is_vip: Optional[bool] = None,
    is_at_risk: Optional[bool] = None,
    is_reward_near: Optional[bool] = None
):
    query = db.query(
        Customer,
        func.count(Visit.id).label("total_visits"),
        func.max(Visit.visited_at).label("last_visit"),
        func.sum(Visit.amount).label("total_spent")
    ).options(selectinload(Customer.profile)).outerjoin(Visit, Customer.id == Visit.customer_id).group_by(Customer.id)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Customer.name.ilike(search_filter)) |
            (Customer.phone_number.like(search_filter))
        )
        
    if birthday_month is not None:
        query = query.join(CustomerProfile, Customer.id == CustomerProfile.customer_id).filter(
            func.extract('month', CustomerProfile.birthday) == birthday_month
        )
    if birthday_day is not None:
        if birthday_month is None: # Join only if not already joined
             query = query.join(CustomerProfile, Customer.id == CustomerProfile.customer_id)
        query = query.filter(func.extract('day', CustomerProfile.birthday) == birthday_day)
        
    if anniversary_month is not None:
        # Check if already joined via birthday filters
        is_joined = birthday_month is not None or birthday_day is not None
        if not is_joined:
            query = query.join(CustomerProfile, Customer.id == CustomerProfile.customer_id)
        query = query.filter(func.extract('month', CustomerProfile.anniversary) == anniversary_month)
    if anniversary_day is not None:
        is_joined = birthday_month is not None or birthday_day is not None or anniversary_month is not None
        if not is_joined:
            query = query.join(CustomerProfile, Customer.id == CustomerProfile.customer_id)
        query = query.filter(func.extract('day', CustomerProfile.anniversary) == anniversary_day)
        
    if is_celebrating_today:
        today = date.today()
        # Check if already joined
        is_joined = birthday_month is not None or birthday_day is not None or anniversary_month is not None or anniversary_day is not None
        if not is_joined:
            query = query.join(CustomerProfile, Customer.id == CustomerProfile.customer_id)
            
        query = query.filter(
            ((func.extract('month', CustomerProfile.birthday) == today.month) & (func.extract('day', CustomerProfile.birthday) == today.day)) |
            ((func.extract('month', CustomerProfile.anniversary) == today.month) & (func.extract('day', CustomerProfile.anniversary) == today.day))
        )
        
    if is_at_risk:
        # 30-90 days since last visit, MUST have at least one visit
        cutoff_30 = datetime.now(timezone.utc) - timedelta(days=30)
        cutoff_90 = datetime.now(timezone.utc) - timedelta(days=90)
        query = query.having(and_(
            func.max(Visit.visited_at) < cutoff_30,
            func.max(Visit.visited_at) >= cutoff_90,
            func.max(Visit.visited_at).isnot(None)
        ))

    if is_vip:
        # Top 10% by total spent
        total_customers = db.query(Customer).count()
        vip_limit = max(1, int(total_customers * 0.1))
        
        # Subquery for top spender IDs
        vip_ids_sub = db.query(Customer.id).outerjoin(Visit)\
                        .group_by(Customer.id)\
                        .order_by(desc(func.sum(Visit.amount)))\
                        .limit(vip_limit).subquery()
        
        query = query.filter(Customer.id.in_(vip_ids_sub))

    if is_reward_near:
        # Customers within 2 visits of any active milestone reward (including boundary)
        query = query.outerjoin(LoyaltyProgress, Customer.id == LoyaltyProgress.customer_id)\
                     .filter(exists().where(
                         and_(
                             LoyaltyReward.reward_type == 'milestone',
                             LoyaltyReward.is_active == True,
                             LoyaltyReward.required_visits - func.coalesce(LoyaltyProgress.lifetime_visits, 0) <= 2,
                             LoyaltyReward.required_visits - func.coalesce(LoyaltyProgress.lifetime_visits, 0) >= 0
                         )
                     ))

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
            "birthday": customer.profile.birthday if customer.profile else None,
            "anniversary": customer.profile.anniversary if customer.profile else None,
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
    ).options(selectinload(Customer.profile)).outerjoin(Visit, Customer.id == Visit.customer_id)\
     .filter(Customer.id == customer_id).group_by(Customer.id).first()
     
    if not customer_info or not customer_info[0]:
        return None
        
    customer, total_visits, last_visit, total_spent = customer_info
    
    return {
        "id": customer.id,
        "phone_number": customer.phone_number,
        "name": customer.name,
        "birthday": customer.profile.birthday if customer.profile else None,
        "anniversary": customer.profile.anniversary if customer.profile else None,
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
