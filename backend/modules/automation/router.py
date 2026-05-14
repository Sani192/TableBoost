from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from modules.automation import service
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/automation", tags=["Automation"])

class AutomationConfigBase(BaseModel):
    automation_type: str
    is_enabled: bool
    message_template: Optional[str] = "Hi {name}, we miss you! Visit us soon for a special treat."
    settings: Optional[dict] = None

@router.get("/", response_model=List[AutomationConfigBase])
def list_automations(db: Session = Depends(get_db)):
    return service.get_automation_configs(db)

@router.post("/", response_model=AutomationConfigBase)
def update_automation(config: AutomationConfigBase, db: Session = Depends(get_db)):
    return service.update_automation_config(db, config.dict())
