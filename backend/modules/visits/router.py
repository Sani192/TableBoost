import logging
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from modules.visits.schemas import VisitCreate, VisitResponse, VisitDetail
from modules.visits import service
from modules.auth.router import get_current_tenant, check_role

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
    tenant_context = Depends(check_role(["OWNER", "MANAGER"])),
    db: Session = Depends(get_db)
):
    current_user = tenant_context["user"]
    restaurant_id = tenant_context["restaurant_id"]
    features = current_user.get_features(restaurant_id)
    has_intel = "intelligence" in features
    return service.get_visits(
        db,
        restaurant_id=restaurant_id,
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

import time
from collections import defaultdict
import hashlib
import json

# Idempotency cache for operational mutations
# Key: user_id:payload_hash, Value: timestamp
idempotency_cache = {}
IDEMPOTENCY_WINDOW_SECONDS = 5

@router.post("/", response_model=VisitResponse)
def create_visit(
    visit_data: VisitCreate, 
    tenant_context = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    current_user = tenant_context["user"]
    restaurant_id = tenant_context["restaurant_id"]
    
    # Idempotency check
    payload_str = visit_data.model_dump_json()
    payload_hash = hashlib.sha256(payload_str.encode()).hexdigest()
    cache_key = f"{current_user.id}:{payload_hash}"
    
    import os
    if not os.getenv("TESTING"):
        current_time = time.time()
        
        # Cleanup old entries
        global idempotency_cache
        idempotency_cache = {k: v for k, v in idempotency_cache.items() if current_time - v < IDEMPOTENCY_WINDOW_SECONDS}
        
        if cache_key in idempotency_cache:
            raise HTTPException(
                status_code=409, 
                detail="Duplicate request detected. Please wait a moment before trying again."
            )
            
        idempotency_cache[cache_key] = current_time

    try:
        visit = service.add_visit(db, restaurant_id, visit_data)
        log_audit_event(
            db,
            restaurant_id=restaurant_id,
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
            restaurant_id=restaurant_id,
            actor_id=current_user.id,
            actor_username=current_user.username,
            action="CREATE_VISIT",
            entity_type="Visit",
            entity_id=None,
            status="FAILED",
            metadata_json={"phone_number": visit_data.phone_number, "amount": visit_data.amount, "error": str(e)}
        )
        db.rollback()
        raise HTTPException(status_code=500, detail="An unexpected error occurred while saving the visit.")
