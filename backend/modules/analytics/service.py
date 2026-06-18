from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc, and_, exists
from datetime import datetime, timedelta, timezone
from modules.visits.models import Visit
from modules.customers.models import Customer
from modules.loyalty.models import RewardRedemption, LoyaltyReward, LoyaltyProgress
from modules.messaging.models import Message

def get_revenue_metrics(db: Session, restaurant_id: int):
    today = datetime.now(timezone.utc)
    
    # Fetch restaurant timezone
    from modules.restaurants.models import Restaurant
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    tz_name = restaurant.timezone if restaurant else "UTC"
    
    try:
        from zoneinfo import ZoneInfo
    except ImportError:
        from backports.zoneinfo import ZoneInfo
    
    tz = ZoneInfo(tz_name)
    local_today = today.astimezone(tz)
    local_start = local_today - timedelta(days=6)
    
    # Start date in UTC context (at least 1 day extra to cover offsets)
    seven_days_ago_utc = (today - timedelta(days=7)).replace(hour=0, minute=0, second=0, microsecond=0)
    
    # 1. Daily Revenue (Last 7 days - GAP FILLED via local timezone mapping)
    visits_raw = db.query(Visit).filter(
        Visit.restaurant_id == restaurant_id,
        Visit.status == "active",
        Visit.visited_at >= seven_days_ago_utc
    ).all()
    
    from collections import defaultdict
    daily_revenue_map = defaultdict(lambda: {"revenue": 0.0, "visits": 0})
    
    for v in visits_raw:
        v_dt = v.visited_at
        if v_dt.tzinfo is None:
            v_dt = v_dt.replace(tzinfo=timezone.utc)
        local_dt = v_dt.astimezone(tz)
        local_date_str = local_dt.date().isoformat()
        daily_revenue_map[local_date_str]["revenue"] += float(v.amount or 0)
        daily_revenue_map[local_date_str]["visits"] += 1
        
    daily_trends = []
    for i in range(7):
        day_date = local_start.date() + timedelta(days=i)
        day_str = day_date.isoformat()
        stats = daily_revenue_map.get(day_str, {"revenue": 0.0, "visits": 0})
        daily_trends.append({
            "date": day_str,
            "revenue": stats["revenue"],
            "visits": stats["visits"]
        })
     
    # 2. Average Ticket Size (Rolling 30 days)
    thirty_days_ago = today - timedelta(days=30)
    avg_ticket = db.query(func.avg(Visit.amount)).filter(Visit.restaurant_id == restaurant_id, Visit.status == "active", Visit.visited_at >= thirty_days_ago).scalar() or 0
    
    # 3. New vs Repeat Customer Revenue (Last 30 days)
    # Subquery to find first active visit date for each customer
    first_visits = db.query(
        Visit.customer_id,
        func.min(Visit.visited_at).label('first_visit_at')
    ).filter(Visit.restaurant_id == restaurant_id, Visit.status == "active").group_by(Visit.customer_id).subquery()
    
    revenue_split = db.query(
        case(
            (Visit.visited_at == first_visits.c.first_visit_at, 'New'),
            else_='Repeat'
        ).label('customer_type'),
        func.sum(Visit.amount).label('total_revenue')
    ).join(first_visits, Visit.customer_id == first_visits.c.customer_id)\
     .filter(Visit.restaurant_id == restaurant_id, Visit.status == "active", Visit.visited_at >= thirty_days_ago)\
     .group_by('customer_type').all()

    # 4. Weekly/Monthly Revenue
    last_week = today - timedelta(days=7)
    weekly_total = db.query(func.sum(Visit.amount)).filter(Visit.restaurant_id == restaurant_id, Visit.status == "active", Visit.visited_at >= last_week).scalar() or 0
    monthly_total = db.query(func.sum(Visit.amount)).filter(Visit.restaurant_id == restaurant_id, Visit.status == "active", Visit.visited_at >= thirty_days_ago).scalar() or 0
    
    # 5. Repeat Visit Rate (Percentage of visits from repeat customers in last 30 days)
    total_visits_30 = db.query(func.count(Visit.id)).filter(Visit.restaurant_id == restaurant_id, Visit.status == "active", Visit.visited_at >= thirty_days_ago).scalar() or 1
    repeat_visits_30 = db.query(func.count(Visit.id)).join(first_visits, Visit.customer_id == first_visits.c.customer_id)\
                        .filter(Visit.restaurant_id == restaurant_id, Visit.status == "active", Visit.visited_at >= thirty_days_ago)\
                        .filter(Visit.visited_at > first_visits.c.first_visit_at).scalar() or 0
    
    repeat_rate = (repeat_visits_30 / total_visits_30) * 100

    # 6. Rewards Redeemed (Total vs Last 30 days)
    total_redeemed = db.query(func.count(RewardRedemption.id)).filter(RewardRedemption.restaurant_id == restaurant_id).scalar() or 0
    recent_redeemed = db.query(func.count(RewardRedemption.id)).filter(RewardRedemption.restaurant_id == restaurant_id, RewardRedemption.redeemed_at >= thirty_days_ago).scalar() or 0
    
    # 7. Campaign ROI (Last 30 days)
    total_messages = db.query(func.count(Message.id)).filter(
        Message.restaurant_id == restaurant_id,
        Message.type.in_(['campaign', 'automation']),
        Message.status == 'sent',
        Message.sent_at >= thirty_days_ago
    ).scalar() or 0

    converted_messages = db.query(func.count(func.distinct(Message.id))).join(
        Visit, Visit.customer_id == Message.customer_id
    ).filter(
        Message.restaurant_id == restaurant_id,
        Visit.restaurant_id == restaurant_id,
        Visit.status == "active",
        Message.type.in_(['campaign', 'automation']),
        Message.status == 'sent',
        Message.sent_at >= thirty_days_ago,
        Visit.visited_at >= Message.sent_at,
        Visit.visited_at <= Message.sent_at + timedelta(days=7)
    ).scalar() or 0

    # Deduplicated Revenue: sum of active visits where there exists a matching marketing message within 7 days prior
    revenue_generated = db.query(func.sum(Visit.amount)).filter(
        Visit.restaurant_id == restaurant_id,
        Visit.status == "active",
        Visit.visited_at >= thirty_days_ago,
        exists().where(
            and_(
                Message.customer_id == Visit.customer_id,
                Message.restaurant_id == restaurant_id,
                Message.type.in_(['campaign', 'automation']),
                Message.status == 'sent',
                Message.sent_at >= thirty_days_ago,
                Visit.visited_at >= Message.sent_at,
                Visit.visited_at <= Message.sent_at + timedelta(days=7)
            )
        )
    ).scalar() or 0

    conversion_rate = (converted_messages / total_messages) * 100 if total_messages > 0 else 0
    
    return {
        "daily_trends": daily_trends,
        "avg_ticket": float(avg_ticket),
        "revenue_split": {r[0]: float(r[1]) for r in revenue_split},
        "weekly_total": float(weekly_total),
        "monthly_total": float(monthly_total),
        "repeat_rate": float(repeat_rate),
        "rewards_stats": {
            "total_redeemed": total_redeemed,
            "recent_redeemed": recent_redeemed
        },
        "campaign_roi": {
            "total_messages": total_messages,
            "converted_messages": converted_messages,
            "conversion_rate": float(conversion_rate),
            "revenue_generated": float(revenue_generated)
        }
    }

def get_customer_segments(db: Session, restaurant_id: int):
    from modules.intelligence.models import CustomerIntelligence
    from modules.loyalty.models import LoyaltyReward, LoyaltyProgress
    from modules.customers.models import Customer
    from sqlalchemy.sql import exists, and_

    # VIPs (clv_tier == 'high')
    vips_count = db.query(CustomerIntelligence).filter(
        CustomerIntelligence.restaurant_id == restaurant_id,
        CustomerIntelligence.clv_tier == 'high'
    ).count()

    # At-Risk (health_status == 'churn_risk')
    at_risk_count = db.query(CustomerIntelligence).filter(
        CustomerIntelligence.restaurant_id == restaurant_id,
        CustomerIntelligence.health_status == 'churn_risk'
    ).count()

    # Lost (health_status == 'lost')
    lost_count = db.query(CustomerIntelligence).filter(
        CustomerIntelligence.restaurant_id == restaurant_id,
        CustomerIntelligence.health_status == 'lost'
    ).count()

    # New Blood (health_status == 'new')
    new_blood_count = db.query(CustomerIntelligence).filter(
        CustomerIntelligence.restaurant_id == restaurant_id,
        CustomerIntelligence.health_status == 'new'
    ).count()

    # Near Rewards (Within 2 visits of any milestone reward, including those AT threshold)
    near_rewards_count = db.query(Customer).filter(Customer.restaurant_id == restaurant_id).join(LoyaltyProgress, Customer.id == LoyaltyProgress.customer_id)\
                     .filter(exists().where(
                          and_(
                               LoyaltyReward.restaurant_id == restaurant_id,
                               LoyaltyReward.reward_type == 'milestone',
                               LoyaltyReward.is_active == True,
                               LoyaltyReward.required_visits - LoyaltyProgress.lifetime_visits <= 2,
                               LoyaltyReward.required_visits - LoyaltyProgress.lifetime_visits >= 0
                          )
                      )).count()

    return {
        "vips_count": vips_count,
        "at_risk_count": at_risk_count,
        "near_rewards_count": near_rewards_count,
        "lost_count": lost_count,
        "new_blood_count": new_blood_count
    }
