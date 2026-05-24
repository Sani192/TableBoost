from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc, and_, exists
from datetime import datetime, timedelta, timezone
from modules.visits.models import Visit
from modules.customers.models import Customer
from modules.loyalty.models import RewardRedemption, LoyaltyReward, LoyaltyProgress
from modules.messaging.models import Message

def get_revenue_metrics(db: Session, restaurant_id: int):
    today = datetime.now(timezone.utc)
    
    # 1. Daily Revenue (Last 7 days - GAP FILLED)
    seven_days_ago = (today - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
    daily_revenue_raw = db.query(
        func.date(Visit.visited_at).label('date'),
        func.sum(Visit.amount).label('revenue'),
        func.count(Visit.id).label('visit_count')
    ).filter(Visit.restaurant_id == restaurant_id, Visit.visited_at >= seven_days_ago)\
     .group_by(func.date(Visit.visited_at))\
     .order_by(func.date(Visit.visited_at)).all()
     
    # Fill gaps for the last 7 days
    revenue_map = {str(r[0]): {"revenue": float(r[1]), "visits": r[2]} for r in daily_revenue_raw}
    daily_trends = []
    for i in range(7):
        day_date = (seven_days_ago + timedelta(days=i)).date()
        day_str = str(day_date)
        stats = revenue_map.get(day_str, {"revenue": 0.0, "visits": 0})
        daily_trends.append({
            "date": day_str,
            "revenue": stats["revenue"],
            "visits": stats["visits"]
        })
     
    # 2. Average Ticket Size (Rolling 30 days)
    thirty_days_ago = today - timedelta(days=30)
    avg_ticket = db.query(func.avg(Visit.amount)).filter(Visit.restaurant_id == restaurant_id, Visit.visited_at >= thirty_days_ago).scalar() or 0
    
    # 3. New vs Repeat Customer Revenue (Last 30 days)
    thirty_days_ago = today - timedelta(days=30)
    
    # Subquery to find first visit date for each customer
    first_visits = db.query(
        Visit.customer_id,
        func.min(Visit.visited_at).label('first_visit_at')
    ).filter(Visit.restaurant_id == restaurant_id).group_by(Visit.customer_id).subquery()
    
    revenue_split = db.query(
        case(
            (Visit.visited_at == first_visits.c.first_visit_at, 'New'),
            else_='Repeat'
        ).label('customer_type'),
        func.sum(Visit.amount).label('total_revenue')
    ).join(first_visits, Visit.customer_id == first_visits.c.customer_id)\
     .filter(Visit.restaurant_id == restaurant_id, Visit.visited_at >= thirty_days_ago)\
     .group_by('customer_type').all()

    # 4. Weekly/Monthly Revenue
    last_week = today - timedelta(days=7)
    weekly_total = db.query(func.sum(Visit.amount)).filter(Visit.restaurant_id == restaurant_id, Visit.visited_at >= last_week).scalar() or 0
    monthly_total = db.query(func.sum(Visit.amount)).filter(Visit.restaurant_id == restaurant_id, Visit.visited_at >= thirty_days_ago).scalar() or 0
    
    # 5. Repeat Visit Rate (Percentage of visits from repeat customers in last 30 days)
    total_visits_30 = db.query(func.count(Visit.id)).filter(Visit.restaurant_id == restaurant_id, Visit.visited_at >= thirty_days_ago).scalar() or 1
    repeat_visits_30 = db.query(func.count(Visit.id)).join(first_visits, Visit.customer_id == first_visits.c.customer_id)\
                        .filter(Visit.restaurant_id == restaurant_id, Visit.visited_at >= thirty_days_ago)\
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
        Message.type.in_(['campaign', 'automation']),
        Message.status == 'sent',
        Message.sent_at >= thirty_days_ago,
        Visit.visited_at >= Message.sent_at,
        Visit.visited_at <= Message.sent_at + timedelta(days=7)
    ).scalar() or 0

    revenue_generated = db.query(func.sum(Visit.amount)).join(
        Message, Visit.customer_id == Message.customer_id
    ).filter(
        Message.restaurant_id == restaurant_id,
        Visit.restaurant_id == restaurant_id,
        Message.type.in_(['campaign', 'automation']),
        Message.status == 'sent',
        Message.sent_at >= thirty_days_ago,
        Visit.visited_at >= Message.sent_at,
        Visit.visited_at <= Message.sent_at + timedelta(days=7)
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
    # VIPs (Top 10% spenders)
    total_customers = db.query(Customer).filter(Customer.restaurant_id == restaurant_id).count()
    vip_limit = max(1, int(total_customers * 0.1))
    
    total_spent_sub = db.query(
        Visit.customer_id,
        func.sum(Visit.amount).label('total_amount')
    ).filter(Visit.restaurant_id == restaurant_id).group_by(Visit.customer_id).order_by(desc('total_amount')).subquery()
    
    vips = db.query(Customer).filter(Customer.restaurant_id == restaurant_id).join(total_spent_sub, Customer.id == total_spent_sub.c.customer_id)\
             .order_by(desc(total_spent_sub.c.total_amount)).limit(vip_limit).all()
             
    # At-Risk (No visits in 30-90 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    ninety_days_ago = datetime.now(timezone.utc) - timedelta(days=90)
    
    last_visits = db.query(
        Visit.customer_id,
        func.max(Visit.visited_at).label('last_visit')
    ).filter(Visit.restaurant_id == restaurant_id).group_by(Visit.customer_id).subquery()
    
    at_risk_count = db.query(Customer).filter(Customer.restaurant_id == restaurant_id).join(last_visits, Customer.id == last_visits.c.customer_id)\
                .filter(and_(
                    last_visits.c.last_visit < thirty_days_ago,
                    last_visits.c.last_visit >= ninety_days_ago
                )).count()

    # Lost (No visits in 90+ days)
    lost_count = db.query(Customer).filter(Customer.restaurant_id == restaurant_id).join(last_visits, Customer.id == last_visits.c.customer_id)\
                .filter(last_visits.c.last_visit < ninety_days_ago).count()

    # New Blood (Joined in last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    new_blood_count = db.query(Customer).filter(Customer.restaurant_id == restaurant_id, Customer.created_at >= seven_days_ago).count()

    # 3. Near Rewards (Within 2 visits of any milestone reward, including those AT threshold)
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
        "vips_count": len(vips),
        "at_risk_count": at_risk_count,
        "near_rewards_count": near_rewards_count,
        "lost_count": lost_count,
        "new_blood_count": new_blood_count
    }
