from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from modules.messaging import schemas, service

router = APIRouter(prefix="/api/messages", tags=["Messaging"])

@router.get("/", response_model=List[schemas.MessageLogResponse])
def get_message_logs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return service.get_messages(db, skip=skip, limit=limit)

@router.post("/campaign")
def create_campaign(campaign: schemas.CampaignCreateRequest, db: Session = Depends(get_db)):
    try:
        result = service.execute_campaign(db, campaign.message, campaign.audience_type, campaign.inactive_days)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
