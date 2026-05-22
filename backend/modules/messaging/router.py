from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from modules.messaging import schemas, service
from modules.auth.router import get_current_user, check_role, check_feature
from fastapi import Depends

router = APIRouter(
    prefix="/api/messages", 
    tags=["Messaging"],
    dependencies=[Depends(check_feature("campaigns"))]
)

from typing import Optional
from datetime import datetime

@router.get("/campaign/audience-count", dependencies=[Depends(check_role(["OWNER", "MANAGER"]))])
def get_campaign_audience_count(
    audience_type: str,
    inactive_days: Optional[int] = None,
    db: Session = Depends(get_db)
):
    count = service.get_audience_count(db, audience_type, inactive_days)
    return {"count": count}

@router.get("/", response_model=List[schemas.MessageLogResponse], dependencies=[Depends(check_role(["OWNER", "MANAGER"]))])
def get_message_logs(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    return service.get_messages(
        db, 
        skip=skip, 
        limit=limit,
        search=search,
        log_type=type,
        status=status,
        start_date=start_date,
        end_date=end_date
    )

from modules.governance.service import log_audit_event

import time
import hashlib
from collections import defaultdict

# Cache to prevent duplicate campaign sends
campaign_idempotency_cache = {}
CAMPAIGN_IDEMPOTENCY_WINDOW = 30 # seconds

# Rate limit campaign sends per user
campaign_rate_limit = defaultdict(list)
CAMPAIGN_RATE_MAX = 5 # max 5 campaigns
CAMPAIGN_RATE_WINDOW = 300 # per 5 minutes

@router.post("/campaign")
def create_campaign(
    campaign: schemas.CampaignCreateRequest, 
    current_user = Depends(check_role(["OWNER", "MANAGER"])),
    db: Session = Depends(get_db)
):
    current_time = time.time()
    
    # 1. Throttling
    global campaign_rate_limit
    campaign_rate_limit[current_user.id] = [t for t in campaign_rate_limit[current_user.id] if current_time - t < CAMPAIGN_RATE_WINDOW]
    if len(campaign_rate_limit[current_user.id]) >= CAMPAIGN_RATE_MAX:
        raise HTTPException(
            status_code=429, 
            detail="Too many campaigns sent recently. Please wait a few minutes."
        )

    # 2. Idempotency Check
    payload_str = campaign.model_dump_json()
    payload_hash = hashlib.sha256(payload_str.encode()).hexdigest()
    cache_key = f"{current_user.id}:{payload_hash}"
    
    global campaign_idempotency_cache
    campaign_idempotency_cache = {k: v for k, v in campaign_idempotency_cache.items() if current_time - v < CAMPAIGN_IDEMPOTENCY_WINDOW}
    
    if cache_key in campaign_idempotency_cache:
        raise HTTPException(
            status_code=409, 
            detail="Duplicate campaign request detected. Please wait."
        )
        
    campaign_idempotency_cache[cache_key] = current_time
    campaign_rate_limit[current_user.id].append(current_time)

    try:
        result = service.execute_campaign(db, campaign.message, campaign.audience_type, campaign.inactive_days)
        log_audit_event(
            db,
            actor_id=current_user.id,
            actor_username=current_user.username,
            action="SEND_CAMPAIGN",
            entity_type="Campaign",
            entity_id=None,
            status="SUCCESS",
            metadata_json={
                "audience_type": campaign.audience_type,
                "inactive_days": campaign.inactive_days,
                "sent_count": result.get("sent_count", 0),
                "failed_count": result.get("failed_count", 0)
            }
        )
        return result
    except Exception as e:
        log_audit_event(
            db,
            actor_id=current_user.id,
            actor_username=current_user.username,
            action="SEND_CAMPAIGN",
            entity_type="Campaign",
            entity_id=None,
            status="FAILED",
            metadata_json={
                "audience_type": campaign.audience_type,
                "inactive_days": campaign.inactive_days,
                "error": str(e)
            }
        )
        raise HTTPException(status_code=500, detail=str(e))
