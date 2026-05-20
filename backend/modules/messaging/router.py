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

@router.post("/campaign")
def create_campaign(
    campaign: schemas.CampaignCreateRequest, 
    current_user = Depends(check_role(["OWNER", "MANAGER"])),
    db: Session = Depends(get_db)
):
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
