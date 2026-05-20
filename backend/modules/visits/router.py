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

@router.post("/", response_model=VisitResponse, dependencies=[Depends(get_current_user)])
def create_visit(visit_data: VisitCreate, db: Session = Depends(get_db)):
    try:
        return service.add_visit(db, visit_data)
    except Exception as e:
        logger.error(f"Failed to create visit: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred while saving the visit.")

