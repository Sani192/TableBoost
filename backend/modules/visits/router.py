import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from modules.visits.schemas import VisitCreate, VisitResponse, VisitDetail
from modules.visits import service
from modules.auth.router import get_current_user, check_role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/visits", tags=["Visits"])

@router.get("/", response_model=List[VisitDetail])
def list_visits(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    sort_by: str = "visited_at",
    sort_order: str = "desc",
    current_user = Depends(check_role(["OWNER", "MANAGER"])),
    db: Session = Depends(get_db)
):
    has_intel = "intelligence" in current_user.features
    return service.get_visits(
        db, 
        skip=skip, 
        limit=limit, 
        search=search, 
        start_date=start_date, 
        end_date=end_date, 
        min_amount=min_amount, 
        max_amount=max_amount,
        sort_by=sort_by,
        sort_order=sort_order,
        has_intel=has_intel
    )

from modules.governance.service import log_audit_event

@router.post("/", response_model=VisitResponse)
def create_visit(
    visit_data: VisitCreate, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        visit = service.add_visit(db, visit_data)
        log_audit_event(
            db,
            actor_id=current_user.id,
            actor_username=current_user.username,
            action="CREATE_VISIT",
            entity_type="Visit",
            entity_id=str(visit.id),
            status="SUCCESS",
            metadata_json={"phone_number": visit_data.phone_number, "amount": visit_data.amount}
        )
        return visit
    except Exception as e:
        logger.error(f"Failed to create visit: {e}", exc_info=True)
        log_audit_event(
            db,
            actor_id=current_user.id,
            actor_username=current_user.username,
            action="CREATE_VISIT",
            entity_type="Visit",
            entity_id=None,
            status="FAILED",
            metadata_json={"phone_number": visit_data.phone_number, "amount": visit_data.amount, "error": str(e)}
        )
        raise HTTPException(status_code=500, detail="An unexpected error occurred while saving the visit.")

