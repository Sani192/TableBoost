from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from modules.automation import service
from typing import List, Optional
from pydantic import BaseModel
from modules.auth.router import get_current_tenant, check_role, check_feature
from fastapi import Depends

router = APIRouter(
    prefix="/api/automation", 
    tags=["Automation"],
    dependencies=[Depends(check_feature("automation"))]
)

class AutomationConfigBase(BaseModel):
    automation_type: str
    is_enabled: bool
    message_template: Optional[str] = None
    settings: Optional[dict] = None

class AutomationUpdate(BaseModel):
    automation_type: str
    is_enabled: Optional[bool] = None
    message_template: Optional[str] = None
    settings: Optional[dict] = None

from modules.governance.service import log_audit_event

@router.get("/", response_model=List[AutomationConfigBase])
def list_automations(
    tenant_context = Depends(check_role(["OWNER"])),
    db: Session = Depends(get_db)
):
    restaurant_id = tenant_context["restaurant_id"]
    return service.get_automation_configs(db, restaurant_id)

@router.post("/", response_model=AutomationConfigBase)
def update_automation(
    config: AutomationUpdate, 
    tenant_context = Depends(check_role(["OWNER"])),
    db: Session = Depends(get_db)
):
    current_user = tenant_context["user"]
    restaurant_id = tenant_context["restaurant_id"]
    updated_config = service.update_automation_config(db, restaurant_id, config.dict(exclude_unset=True))
    
    # Log audit event
    log_audit_event(
        db,
        restaurant_id=restaurant_id,
        actor_id=current_user.id,
        actor_username=current_user.username,
        action="TOGGLE_AUTOMATION" if config.is_enabled is not None and len(config.dict(exclude_unset=True)) <= 2 else "UPDATE_AUTOMATION",
        entity_type="AutomationConfig",
        entity_id=str(updated_config.id),
        status="SUCCESS",
        metadata_json=config.dict(exclude_unset=True)
    )
    
    # Sync scheduler to apply changes immediately
    from core.scheduler import scheduler
    service.sync_scheduler(scheduler, db)
    
    return updated_config
