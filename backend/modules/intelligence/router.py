from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from modules.intelligence import service
from modules.auth.router import get_current_user, check_role, check_feature
from fastapi import Depends

router = APIRouter(
    prefix="/api/intelligence", 
    tags=["Intelligence"], 
    dependencies=[Depends(check_role(["OWNER", "MANAGER"])), Depends(check_feature("intelligence"))]
)


@router.get("/growth")
def get_growth_dashboard(db: Session = Depends(get_db)):
    """Growth tab dashboard data."""
    return service.get_growth_dashboard(db)


@router.get("/customer/{customer_id}")
def get_customer_intelligence(customer_id: int, db: Session = Depends(get_db)):
    """Per-customer CLV + health detail."""
    result = service.get_customer_intel(db, customer_id)
    if not result:
        return {"customer_id": customer_id, "clv_score": 0, "clv_tier": "new",
                "health_status": "new", "health_score": 50, "message": "Intelligence not yet computed"}
    return result


@router.get("/campaigns")
def get_campaign_roi(db: Session = Depends(get_db)):
    """Per-campaign ROI list."""
    return service.get_campaign_roi_list(db)


@router.get("/campaigns/{campaign_id}/customers")
def get_campaign_customers(campaign_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """List customers targeted by a campaign with conversion status."""
    return service.get_campaign_customers(db, campaign_id, skip, limit)


@router.get("/rewards")
def get_reward_effectiveness(db: Session = Depends(get_db)):
    """Per-reward effectiveness."""
    return service.get_reward_effectiveness_list(db)


@router.get("/rewards/customers")
def get_all_reward_customers(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """List customers who redeemed ANY reward."""
    return service.get_reward_customers(db, None, skip, limit)


@router.get("/rewards/{reward_id}/customers")
def get_reward_customers(reward_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """List customers who redeemed a reward."""
    return service.get_reward_customers(db, reward_id, skip, limit)


@router.get("/automations")
def get_automation_effectiveness(db: Session = Depends(get_db)):
    """Per-automation effectiveness."""
    return service.get_automation_effectiveness_list(db)


@router.get("/summaries")
def get_summaries(limit: int = 10, db: Session = Depends(get_db)):
    """Business summaries list."""
    return service.get_summaries_list(db, limit=limit)


@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    """Active recommendations."""
    from modules.intelligence.models import Recommendation
    recs = db.query(Recommendation).filter(
        Recommendation.is_dismissed == False
    ).order_by(Recommendation.created_at.desc()).limit(5).all()
    return [
        {
            "id": r.id, "rule_id": r.rule_id, "message": r.message,
            "priority": r.priority, "action_type": r.action_type,
            "action_params": r.action_params,
        }
        for r in recs
    ]


@router.get("/customers")
def get_intelligence_customers(filter: str = None, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """List customers with intelligence filters."""
    from modules.intelligence.models import CustomerIntelligence
    from modules.customers.models import Customer
    
    query = db.query(Customer, CustomerIntelligence).join(CustomerIntelligence, Customer.id == CustomerIntelligence.customer_id)
    
    if filter == "declining_vip":
        query = query.filter(
            CustomerIntelligence.clv_tier == "high",
            CustomerIntelligence.health_status.in_(["declining", "churn_risk"])
        )
    elif filter == "healthy":
        query = query.filter(CustomerIntelligence.health_status == "healthy")
    elif filter == "declining":
        query = query.filter(CustomerIntelligence.health_status == "declining")
    elif filter == "churn_risk":
        query = query.filter(CustomerIntelligence.health_status == "churn_risk")
    elif filter == "net_new":
        from datetime import datetime, timedelta, timezone
        cutoff = datetime.now(timezone.utc) - timedelta(days=30)
        query = query.filter(Customer.created_at >= cutoff)
    elif filter == "repeat":
        query = query.filter(CustomerIntelligence.visit_count > 1)
    elif filter == "redeemed":
        from modules.loyalty.models import RewardRedemption
        query = query.filter(Customer.id.in_(db.query(RewardRedemption.customer_id)))
    elif filter == "visited":
        query = query.filter(CustomerIntelligence.visit_count > 0)
        
    results = query.offset(skip).limit(limit).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "phone_number": c.phone_number,
            "total_visits": intel.visit_count,
            "total_spent": intel.total_spent
        }
        for c, intel in results
    ]


@router.post("/recommendations/{rec_id}/dismiss")
def dismiss_recommendation(rec_id: int, db: Session = Depends(get_db)):
    """Dismiss a recommendation."""
    result = service.dismiss_recommendation(db, rec_id)
    if not result:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return {"status": "dismissed"}
