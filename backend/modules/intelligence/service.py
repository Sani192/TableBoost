from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, case
from datetime import datetime, timedelta, timezone, date
import logging
import json

from modules.intelligence.models import (
    CustomerIntelligence, CampaignSummary, RewardSummary,
    AutomationSummary, BusinessSummary, Recommendation
)
from modules.customers.models import Customer
from modules.visits.models import Visit
from modules.messaging.models import Message, Campaign
from modules.loyalty.models import RewardRedemption, LoyaltyReward, LoyaltyProgress
from modules.automation.models import AutomationHistory

logger = logging.getLogger(__name__)

# ── CLV + Health Computation ──────────────────────────────────────────────

def compute_daily_intelligence(db: Session):
    """Recompute CLV and health scores for all customers. Called by scheduler."""
    logger.info("Starting daily intelligence computation")
    now = datetime.now(timezone.utc)

    customers = db.query(
        Customer.id,
        func.count(Visit.id).label("visit_count"),
        func.sum(Visit.amount).label("total_spent"),
        func.max(Visit.visited_at).label("last_visit"),
        func.min(Visit.visited_at).label("first_visit"),
    ).outerjoin(Visit).group_by(Customer.id).all()

    updated = 0
    all_scores = []

    for cust in customers:
        cid = cust[0]
        visit_count = cust.visit_count or 0
        total_spent = float(cust.total_spent or 0)
        last_visit = cust.last_visit
        first_visit = cust.first_visit

        if last_visit and last_visit.tzinfo is None:
            last_visit = last_visit.replace(tzinfo=timezone.utc)
        if first_visit and first_visit.tzinfo is None:
            first_visit = first_visit.replace(tzinfo=timezone.utc)

        # ── CLV ──
        freq_factor = 1.0
        recency_factor = 0.1
        avg_gap = None

        if visit_count >= 2 and first_visit and last_visit:
            span_days = max((last_visit - first_visit).total_seconds() / 86400, 1)
            freq_factor = min(visit_count / (span_days / 30), 10)
            avg_gap = span_days / (visit_count - 1)

        if last_visit:
            days_since = (now - last_visit).total_seconds() / 86400
            if days_since <= 7:
                recency_factor = 1.0
            elif days_since <= 30:
                recency_factor = 0.8
            elif days_since <= 60:
                recency_factor = 0.5
            elif days_since <= 90:
                recency_factor = 0.3
            else:
                recency_factor = 0.1

        clv_score = round(total_spent * freq_factor * recency_factor, 2)
        all_scores.append((cid, clv_score))

        # ── Health ──
        health_status = "new"
        health_score_val = 50

        if visit_count < 3:
            health_status = "new"
            health_score_val = 50
        elif avg_gap and last_visit:
            days_since = (now - last_visit).total_seconds() / 86400
            ratio = days_since / avg_gap if avg_gap > 0 else 0
            if ratio <= 1.2:
                health_status = "healthy"
                health_score_val = 90
            elif ratio <= 1.8:
                health_status = "cooling"
                health_score_val = 65
            elif ratio <= 2.5:
                health_status = "declining"
                health_score_val = 35
            else:
                health_status = "churn_risk"
                health_score_val = 10

        # ── Spend trend ──
        spend_trend = "stable"
        if visit_count >= 4 and last_visit:
            mid = first_visit + (last_visit - first_visit) / 2 if first_visit else now
            early = float(db.query(func.avg(Visit.amount)).filter(
                Visit.customer_id == cid, Visit.visited_at < mid
            ).scalar() or 0)
            late = float(db.query(func.avg(Visit.amount)).filter(
                Visit.customer_id == cid, Visit.visited_at >= mid
            ).scalar() or 0)
            if late > early * 1.15:
                spend_trend = "growing"
            elif late < early * 0.85:
                spend_trend = "declining"

        # ── Upsert ──
        intel = db.query(CustomerIntelligence).filter(
            CustomerIntelligence.customer_id == cid
        ).first()
        if not intel:
            intel = CustomerIntelligence(customer_id=cid)
            db.add(intel)

        intel.clv_score = clv_score
        intel.total_spent = total_spent
        intel.visit_count = visit_count
        intel.avg_visit_gap_days = avg_gap
        intel.last_visit_at = last_visit
        intel.health_status = health_status
        intel.health_score = health_score_val
        intel.spend_trend = spend_trend
        intel.computed_at = now
        updated += 1

    # ── Assign CLV tiers ──
    all_scores.sort(key=lambda x: x[1], reverse=True)
    total = len(all_scores)
    top20 = max(1, int(total * 0.2))
    top60 = max(2, int(total * 0.6))

    tier_map = {}
    for i, (cid, _) in enumerate(all_scores):
        if i < top20:
            tier_map[cid] = "high"
        elif i < top60:
            tier_map[cid] = "medium"
        else:
            tier_map[cid] = "low"

    for cid, tier in tier_map.items():
        db.query(CustomerIntelligence).filter(
            CustomerIntelligence.customer_id == cid
        ).update({"clv_tier": tier})

    db.commit()
    logger.info(f"Daily intelligence: updated {updated} customers")
    return updated


# ── Campaign ROI ──────────────────────────────────────────────────────────

def compute_campaign_summaries(db: Session):
    """Compute per-campaign ROI summaries."""
    logger.info("Computing campaign summaries")
    now = datetime.now(timezone.utc)
    campaigns = db.query(Campaign).filter(Campaign.status == "completed").all()
    count = 0

    for camp in campaigns:
        msgs = db.query(Message).filter(
            Message.status == "sent",
            (Message.campaign_id == camp.id) | 
            ((Message.campaign_id == None) & (Message.type == "campaign") & (Message.message_text.contains(camp.message_template[:30]) if camp.message_template else True))
        ).all()

        total_sent = len(msgs)
        converted = 0
        revenue = 0.0

        for msg in msgs:
            visit = db.query(Visit).filter(
                Visit.customer_id == msg.customer_id,
                Visit.visited_at >= msg.sent_at,
                Visit.visited_at <= msg.sent_at + timedelta(days=7),
            ).first()
            if visit:
                converted += 1
                revenue += float(visit.amount or 0)

        rate = (converted / total_sent * 100) if total_sent > 0 else 0

        summary = db.query(CampaignSummary).filter(
            CampaignSummary.campaign_id == camp.id
        ).first()
        if not summary:
            summary = CampaignSummary(campaign_id=camp.id)
            db.add(summary)

        summary.total_sent = total_sent
        summary.total_converted = converted
        summary.conversion_rate = round(rate, 1)
        summary.revenue_attributed = round(revenue, 2)
        summary.computed_at = now
        count += 1

    db.commit()
    logger.info(f"Campaign summaries: updated {count}")
    return count


# ── Reward Effectiveness ──────────────────────────────────────────────────

def compute_reward_effectiveness(db: Session):
    """Compute per-reward effectiveness summaries."""
    logger.info("Computing reward effectiveness")
    now = datetime.now(timezone.utc)
    rewards = db.query(LoyaltyReward).all()
    count = 0

    for reward in rewards:
        redeemed = db.query(RewardRedemption).filter(
            RewardRedemption.reward_id == reward.id
        ).all()
        total_redeemed = len(redeemed)

        eligible_count = 0
        if reward.reward_type == "milestone":
            eligible_count = db.query(LoyaltyProgress).filter(
                LoyaltyProgress.lifetime_visits >= reward.required_visits
            ).count()

        redemption_rate = (total_redeemed / eligible_count * 100) if eligible_count > 0 else 0

        revisit_count = 0
        influenced_revenue = 0.0
        for red in redeemed:
            post_visit = db.query(Visit).filter(
                Visit.customer_id == red.customer_id,
                Visit.visited_at > red.redeemed_at,
                Visit.visited_at <= red.redeemed_at + timedelta(days=30),
            ).first()
            if post_visit:
                revisit_count += 1
                influenced_revenue += float(post_visit.amount or 0)

        revisit_rate = (revisit_count / total_redeemed * 100) if total_redeemed > 0 else 0

        summary = db.query(RewardSummary).filter(
            RewardSummary.reward_id == reward.id
        ).first()
        if not summary:
            summary = RewardSummary(reward_id=reward.id)
            db.add(summary)

        summary.total_redeemed = total_redeemed
        summary.eligible_count = eligible_count
        summary.redemption_rate = round(redemption_rate, 1)
        summary.post_reward_revisit_rate = round(revisit_rate, 1)
        summary.reward_influenced_revenue = round(influenced_revenue, 2)
        summary.computed_at = now
        count += 1

    db.commit()
    logger.info(f"Reward effectiveness: updated {count}")
    return count


# ── Automation Effectiveness ──────────────────────────────────────────────

def compute_automation_effectiveness(db: Session):
    """Compute per-automation-type monthly effectiveness."""
    logger.info("Computing automation effectiveness")
    now = datetime.now(timezone.utc)
    current_month = now.strftime("%Y-%m")
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    auto_types = db.query(AutomationHistory.automation_type).distinct().all()
    count = 0

    for (atype,) in auto_types:
        msgs = db.query(Message).filter(
            Message.type == "automation",
            Message.status == "sent",
            Message.sent_at >= month_start,
        ).join(
            AutomationHistory,
            and_(
                AutomationHistory.customer_id == Message.customer_id,
                AutomationHistory.automation_type == atype,
            )
        ).all()

        sent_count = len(msgs)
        revisits = 0
        revenue = 0.0

        for msg in msgs:
            visit = db.query(Visit).filter(
                Visit.customer_id == msg.customer_id,
                Visit.visited_at >= msg.sent_at,
                Visit.visited_at <= msg.sent_at + timedelta(days=7),
            ).first()
            if visit:
                revisits += 1
                revenue += float(visit.amount or 0)

        rate = (revisits / sent_count * 100) if sent_count > 0 else 0

        summary = db.query(AutomationSummary).filter(
            AutomationSummary.automation_type == atype,
            AutomationSummary.period_month == current_month,
        ).first()
        if not summary:
            summary = AutomationSummary(automation_type=atype, period_month=current_month)
            db.add(summary)

        summary.messages_sent = sent_count
        summary.revisit_count = revisits
        summary.revisit_rate = round(rate, 1)
        summary.revenue_attributed = round(revenue, 2)
        summary.computed_at = now
        count += 1

    db.commit()
    logger.info(f"Automation effectiveness: updated {count}")
    return count


# ── Business Summaries ────────────────────────────────────────────────────

def generate_summary(db: Session, period_type: str):
    """Generate weekly or monthly business summary."""
    logger.info(f"Generating {period_type} summary")
    now = datetime.now(timezone.utc)

    if period_type == "weekly":
        period_end = now
        period_start = now - timedelta(days=7)
        prev_start = period_start - timedelta(days=7)
        prev_end = period_start
    else:
        period_end = now
        period_start = now - timedelta(days=30)
        prev_start = period_start - timedelta(days=30)
        prev_end = period_start

    # Current period metrics
    total_visits = db.query(func.count(Visit.id)).filter(
        Visit.visited_at >= period_start, Visit.visited_at < period_end
    ).scalar() or 0
    total_revenue = float(db.query(func.sum(Visit.amount)).filter(
        Visit.visited_at >= period_start, Visit.visited_at < period_end
    ).scalar() or 0)
    new_customers = db.query(func.count(Customer.id)).filter(
        Customer.created_at >= period_start, Customer.created_at < period_end
    ).scalar() or 0
    avg_ticket = float(db.query(func.avg(Visit.amount)).filter(
        Visit.visited_at >= period_start, Visit.visited_at < period_end
    ).scalar() or 0)
    rewards_redeemed = db.query(func.count(RewardRedemption.id)).filter(
        RewardRedemption.redeemed_at >= period_start, RewardRedemption.redeemed_at < period_end
    ).scalar() or 0
    msgs_sent = db.query(func.count(Message.id)).filter(
        Message.type.in_(["campaign", "automation"]),
        Message.sent_at >= period_start, Message.sent_at < period_end,
    ).scalar() or 0

    # Health distribution
    healthy = db.query(func.count(CustomerIntelligence.customer_id)).filter(
        CustomerIntelligence.health_status == "healthy"
    ).scalar() or 0
    declining = db.query(func.count(CustomerIntelligence.customer_id)).filter(
        CustomerIntelligence.health_status == "declining"
    ).scalar() or 0
    churn = db.query(func.count(CustomerIntelligence.customer_id)).filter(
        CustomerIntelligence.health_status == "churn_risk"
    ).scalar() or 0

    # Previous period for trends
    prev_visits = db.query(func.count(Visit.id)).filter(
        Visit.visited_at >= prev_start, Visit.visited_at < prev_end
    ).scalar() or 0
    prev_revenue = float(db.query(func.sum(Visit.amount)).filter(
        Visit.visited_at >= prev_start, Visit.visited_at < prev_end
    ).scalar() or 0)
    prev_new = db.query(func.count(Customer.id)).filter(
        Customer.created_at >= prev_start, Customer.created_at < prev_end
    ).scalar() or 0

    def pct(curr, prev):
        if prev == 0:
            return "+100%" if curr > 0 else "0%"
        change = ((curr - prev) / prev) * 100
        return f"{'+' if change >= 0 else ''}{change:.1f}%"

    metrics = {
        "total_visits": total_visits,
        "total_revenue": round(total_revenue, 2),
        "new_customers": new_customers,
        "avg_ticket": round(avg_ticket, 2),
        "rewards_redeemed": rewards_redeemed,
        "messages_sent": msgs_sent,
        "healthy_customers": healthy,
        "declining_customers": declining,
        "churn_risk_customers": churn,
    }
    trends = {
        "revenue_vs_prev": pct(total_revenue, prev_revenue),
        "visits_vs_prev": pct(total_visits, prev_visits),
        "new_customers_vs_prev": new_customers - prev_new,
    }

    highlights = []
    if total_revenue > prev_revenue:
        highlights.append(f"Revenue up {pct(total_revenue, prev_revenue)} from last period")
    elif total_revenue < prev_revenue:
        highlights.append(f"Revenue down {pct(total_revenue, prev_revenue)} from last period")
    if churn > 0:
        highlights.append(f"{churn} customers at churn risk — consider recovery campaign")
    if rewards_redeemed > 0:
        highlights.append(f"{rewards_redeemed} rewards redeemed this period")

    summary = BusinessSummary(
        period_type=period_type,
        period_start=period_start,
        period_end=period_end,
        metrics=metrics,
        trends=trends,
        highlights=highlights,
    )
    db.add(summary)
    db.commit()
    logger.info(f"{period_type} summary generated")
    return metrics


# ── Recommendations ───────────────────────────────────────────────────────

def evaluate_recommendations(db: Session):
    """Run rule-based recommendation engine."""
    logger.info("Evaluating recommendations")

    # Clear old non-dismissed recommendations
    db.query(Recommendation).filter(Recommendation.is_dismissed == False).delete()
    db.flush()

    recs = []

    # R1: High-value declining customers
    high_declining = db.query(CustomerIntelligence).filter(
        CustomerIntelligence.clv_tier == "high",
        CustomerIntelligence.health_status.in_(["declining", "churn_risk"]),
    ).count()
    if high_declining > 0:
        recs.append(Recommendation(
            rule_id="R1", priority="high",
            message=f"{high_declining} VIP customer{'s are' if high_declining > 1 else ' is'} declining — send a personal recovery message",
            action_type="view_customers",
            action_params={"filter": "declining_vip"},
        ))

    # R2: Churn risk increasing
    now = datetime.now(timezone.utc)
    current_churn = db.query(func.count(CustomerIntelligence.customer_id)).filter(
        CustomerIntelligence.health_status == "churn_risk"
    ).scalar() or 0
    if current_churn > 5:
        recs.append(Recommendation(
            rule_id="R2", priority="high",
            message=f"{current_churn} customers at churn risk — review inactivity automation",
            action_type="review_settings",
        ))

    # R3: Low reward redemption
    low_redemption = db.query(RewardSummary).filter(
        RewardSummary.redemption_rate < 30,
        RewardSummary.eligible_count > 0,
    ).count()
    if low_redemption > 0:
        recs.append(Recommendation(
            rule_id="R4", priority="medium",
            message=f"{low_redemption} reward{'s have' if low_redemption > 1 else ' has'} low redemption rate — consider adjusting thresholds",
            action_type="review_settings",
        ))

    # R4: No campaigns in 14 days
    recent_campaign = db.query(Campaign).filter(
        Campaign.status == "completed",
        Campaign.created_at >= now - timedelta(days=14),
    ).first()
    if not recent_campaign:
        recent_any = db.query(Campaign).first()
        if recent_any:
            recs.append(Recommendation(
                rule_id="R5", priority="medium",
                message="No campaigns sent in 2 weeks — engagement may drop",
                action_type="create_campaign",
            ))

    # R5: Customer growth slowing
    week1_new = db.query(func.count(Customer.id)).filter(
        Customer.created_at >= now - timedelta(days=7)
    ).scalar() or 0
    week2_new = db.query(func.count(Customer.id)).filter(
        Customer.created_at >= now - timedelta(days=14),
        Customer.created_at < now - timedelta(days=7),
    ).scalar() or 0
    if week2_new > 0 and week1_new < week2_new * 0.5:
        recs.append(Recommendation(
            rule_id="R6", priority="medium",
            message="New customer acquisition slowing — consider a new campaign",
            action_type="create_campaign",
        ))

    # Cap at 5
    for r in recs[:5]:
        db.add(r)
    db.commit()
    logger.info(f"Recommendations: generated {min(len(recs), 5)}")
    return min(len(recs), 5)


# ── Orchestrator (called by scheduler) ────────────────────────────────────

def run_all_intelligence(db: Session):
    """Master function called by the scheduled job. Runs all computations."""
    logger.info("=== Starting intelligence pipeline ===")
    compute_daily_intelligence(db)
    compute_campaign_summaries(db)
    compute_reward_effectiveness(db)
    compute_automation_effectiveness(db)
    evaluate_recommendations(db)
    logger.info("=== Intelligence pipeline complete ===")


# ── Query helpers (for API) ───────────────────────────────────────────────

def get_growth_dashboard(db: Session):
    """Return aggregated growth data for the Growth tab."""
    health_counts = {}
    for status in ["healthy", "cooling", "declining", "churn_risk", "new"]:
        health_counts[status] = db.query(func.count(CustomerIntelligence.customer_id)).filter(
            CustomerIntelligence.health_status == status
        ).scalar() or 0

    now = datetime.now(timezone.utc)
    net_new = db.query(func.count(Customer.id)).filter(
        Customer.created_at >= now - timedelta(days=30)
    ).scalar() or 0

    # Latest summary
    latest_summary = db.query(BusinessSummary).order_by(
        BusinessSummary.created_at.desc()
    ).first()

    # Recommendations
    recs = db.query(Recommendation).filter(
        Recommendation.is_dismissed == False
    ).order_by(Recommendation.created_at.desc()).limit(5).all()

    # Reward impact
    reward_revenue = db.query(func.sum(RewardSummary.reward_influenced_revenue)).scalar() or 0
    avg_revisit = db.query(func.avg(RewardSummary.post_reward_revisit_rate)).scalar() or 0

    # Top automation
    top_auto = db.query(AutomationSummary).order_by(
        AutomationSummary.revisit_rate.desc()
    ).first()

    return {
        "health": health_counts,
        "net_new_customers": net_new,
        "latest_summary": {
            "period_type": latest_summary.period_type,
            "metrics": latest_summary.metrics,
            "trends": latest_summary.trends,
            "highlights": latest_summary.highlights,
            "created_at": str(latest_summary.created_at),
        } if latest_summary else None,
        "recommendations": [
            {
                "id": r.id,
                "rule_id": r.rule_id,
                "message": r.message,
                "priority": r.priority,
                "action_type": r.action_type,
                "action_params": r.action_params,
            }
            for r in recs
        ],
        "loyalty_impact": {
            "reward_influenced_revenue": round(float(reward_revenue), 2),
            "avg_revisit_rate": round(float(avg_revisit), 1),
        },
        "top_automation": {
            "type": top_auto.automation_type,
            "revisit_rate": top_auto.revisit_rate,
            "revenue": top_auto.revenue_attributed,
        } if top_auto else None,
    }


def get_customer_intel(db: Session, customer_id: int):
    """Return pre-computed intelligence for a single customer."""
    intel = db.query(CustomerIntelligence).filter(
        CustomerIntelligence.customer_id == customer_id
    ).first()
    if not intel:
        return None
    return {
        "customer_id": intel.customer_id,
        "clv_score": intel.clv_score,
        "clv_tier": intel.clv_tier,
        "total_spent": intel.total_spent,
        "visit_count": intel.visit_count,
        "avg_visit_gap_days": intel.avg_visit_gap_days,
        "last_visit_at": str(intel.last_visit_at) if intel.last_visit_at else None,
        "health_status": intel.health_status,
        "health_score": intel.health_score,
        "spend_trend": intel.spend_trend,
        "computed_at": str(intel.computed_at) if intel.computed_at else None,
    }


def get_campaign_roi_list(db: Session):
    """Return per-campaign ROI summaries."""
    summaries = db.query(CampaignSummary, Campaign.name).join(
        Campaign, CampaignSummary.campaign_id == Campaign.id
    ).order_by(CampaignSummary.revenue_attributed.desc()).all()

    return [
        {
            "campaign_id": s.CampaignSummary.campaign_id,
            "campaign_name": s.name,
            "total_sent": s.CampaignSummary.total_sent,
            "total_converted": s.CampaignSummary.total_converted,
            "conversion_rate": s.CampaignSummary.conversion_rate,
            "revenue_attributed": s.CampaignSummary.revenue_attributed,
        }
        for s in summaries
    ]


def get_campaign_customers(db: Session, campaign_id: int, skip: int = 0, limit: int = 20):
    """Return list of customers targeted by a campaign with conversion status."""
    from modules.messaging.models import Message, Campaign
    from modules.customers.models import Customer
    from modules.visits.models import Visit
    from datetime import timedelta
    
    camp = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not camp:
        return []
        
    msgs = db.query(Message, Customer).join(
        Customer, Message.customer_id == Customer.id
    ).filter(
        Message.status == "sent",
        (Message.campaign_id == camp.id) | 
        ((Message.campaign_id == None) & (Message.type == "campaign") & (Message.message_text.contains(camp.message_template[:30]) if camp.message_template else True))
    ).offset(skip).limit(limit).all()
    
    results = []
    for msg, cust in msgs:
        # Check if converted
        visit = db.query(Visit).filter(
            Visit.customer_id == cust.id,
            Visit.visited_at >= msg.sent_at,
            Visit.visited_at <= msg.sent_at + timedelta(days=7),
        ).first()
        
        results.append({
            "id": cust.id,
            "name": cust.name,
            "phone_number": cust.phone_number,
            "status": "converted" if visit else "sent",
            "amount": float(visit.amount or 0) if visit else 0,
            "visited_at": visit.visited_at if visit else None
        })
        
    return results


def get_reward_customers(db: Session, reward_id: int = None, skip: int = 0, limit: int = 20):
    """Return list of customers who redeemed a reward."""
    from modules.loyalty.models import RewardRedemption
    from modules.customers.models import Customer
    from modules.visits.models import Visit
    from datetime import timedelta
    
    query = db.query(RewardRedemption, Customer).join(
        Customer, RewardRedemption.customer_id == Customer.id
    )
    
    if reward_id is not None:
        query = query.filter(RewardRedemption.reward_id == reward_id)
        
    redemptions = query.offset(skip).limit(limit).all()
    
    from modules.intelligence.models import CustomerIntelligence
    from sqlalchemy import func
    
    results = []
    for red, cust in redemptions:
        # Find visit around redemption time
        visit = db.query(Visit).filter(
            Visit.customer_id == cust.id,
            Visit.visited_at >= red.redeemed_at - timedelta(hours=2),
            Visit.visited_at <= red.redeemed_at + timedelta(hours=2),
        ).first()
        
        intel = db.query(CustomerIntelligence).filter(CustomerIntelligence.customer_id == cust.id).first()
        cust_total_visits = db.query(func.count(Visit.id)).filter(Visit.customer_id == cust.id).scalar() or 0
        total_spent = db.query(func.sum(Visit.amount)).filter(Visit.customer_id == cust.id).scalar() or 0
        
        results.append({
            "id": cust.id,
            "name": cust.name,
            "phone_number": cust.phone_number,
            "status": "redeemed",
            "amount": float(visit.amount or 0) if visit else 0,
            "visited_at": red.redeemed_at,
            "health_status": intel.health_status if intel else None,
            "clv_tier": intel.clv_tier if intel else None,
            "spend_trend": intel.spend_trend if intel else None,
            "total_visits": cust_total_visits,
            "total_spent": float(total_spent)
        })
        
    return results


def get_reward_effectiveness_list(db: Session):
    """Return per-reward effectiveness."""
    summaries = db.query(RewardSummary, LoyaltyReward.name).join(
        LoyaltyReward, RewardSummary.reward_id == LoyaltyReward.id
    ).all()

    return [
        {
            "reward_id": s.RewardSummary.reward_id,
            "reward_name": s.name,
            "total_redeemed": s.RewardSummary.total_redeemed,
            "eligible_count": s.RewardSummary.eligible_count,
            "redemption_rate": s.RewardSummary.redemption_rate,
            "post_reward_revisit_rate": s.RewardSummary.post_reward_revisit_rate,
            "reward_influenced_revenue": s.RewardSummary.reward_influenced_revenue,
        }
        for s in summaries
    ]


def get_automation_effectiveness_list(db: Session):
    """Return per-automation-type effectiveness."""
    summaries = db.query(AutomationSummary).order_by(
        AutomationSummary.period_month.desc(),
        AutomationSummary.revisit_rate.desc(),
    ).all()

    return [
        {
            "automation_type": s.automation_type,
            "period_month": s.period_month,
            "messages_sent": s.messages_sent,
            "revisit_count": s.revisit_count,
            "revisit_rate": s.revisit_rate,
            "revenue_attributed": s.revenue_attributed,
        }
        for s in summaries
    ]


def get_summaries_list(db: Session, limit: int = 10):
    """Return recent business summaries."""
    summaries = db.query(BusinessSummary).order_by(
        BusinessSummary.created_at.desc()
    ).limit(limit).all()

    return [
        {
            "id": s.id,
            "period_type": s.period_type,
            "period_start": str(s.period_start),
            "period_end": str(s.period_end),
            "metrics": s.metrics,
            "trends": s.trends,
            "highlights": s.highlights,
            "created_at": str(s.created_at),
        }
        for s in summaries
    ]


def dismiss_recommendation(db: Session, rec_id: int):
    """Dismiss a recommendation."""
    rec = db.query(Recommendation).filter(Recommendation.id == rec_id).first()
    if rec:
        rec.is_dismissed = True
        db.commit()
    return rec
