from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from modules.intelligence import service

router = APIRouter(prefix="/api/intelligence", tags=["Intelligence"])


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


@router.get("/rewards")
def get_reward_effectiveness(db: Session = Depends(get_db)):
    """Per-reward effectiveness."""
    return service.get_reward_effectiveness_list(db)


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


@router.post("/recommendations/{rec_id}/dismiss")
def dismiss_recommendation(rec_id: int, db: Session = Depends(get_db)):
    """Dismiss a recommendation."""
    result = service.dismiss_recommendation(db, rec_id)
    if not result:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return {"status": "dismissed"}
