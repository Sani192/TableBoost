import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.modules.visits.schemas import VisitCreate, VisitResponse
from backend.modules.visits import service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/visits", tags=["Visits"])

@router.post("/", response_model=VisitResponse)
def create_visit(visit_data: VisitCreate, db: Session = Depends(get_db)):
    try:
        return service.add_visit(db, visit_data)
    except Exception as e:
        logger.error(f"Failed to create visit: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An unexpected error occurred while saving the visit.")

