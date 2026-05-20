from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from modules.settings.schemas import SettingsResponse, SettingsUpdate
from modules.settings import service
from modules.messaging.service import DEFAULT_TEMPLATE
from modules.auth.router import get_current_user, check_role
from modules.governance.service import log_audit_event

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("/", response_model=SettingsResponse, dependencies=[Depends(check_role(["OWNER"]))])
def get_settings(db: Session = Depends(get_db)):
    template = service.get_setting(db, "review_message_template", default=DEFAULT_TEMPLATE)
    auto_send = service.get_setting(db, "auto_send_sms", default=True)
    inactive_days = int(service.get_setting(db, "campaign_inactive_days", default=30))
    return SettingsResponse(
        review_message_template=template,
        auto_send_sms=auto_send,
        campaign_inactive_days=inactive_days
    )

@router.post("/", response_model=SettingsResponse)
def update_settings(
    settings: SettingsUpdate, 
    current_user = Depends(check_role(["OWNER"])), 
    db: Session = Depends(get_db)
):
    if settings.review_message_template is not None:
        service.set_setting(db, "review_message_template", settings.review_message_template)
    if settings.auto_send_sms is not None:
        service.set_setting(db, "auto_send_sms", settings.auto_send_sms)
    if settings.campaign_inactive_days is not None:
        service.set_setting(db, "campaign_inactive_days", settings.campaign_inactive_days)
        
    template = service.get_setting(db, "review_message_template", default=DEFAULT_TEMPLATE)
    auto_send = service.get_setting(db, "auto_send_sms", default=True)
    inactive_days = int(service.get_setting(db, "campaign_inactive_days", default=30))
    
    log_audit_event(
        db,
        actor_id=current_user.id,
        actor_username=current_user.username,
        action="UPDATE_SETTINGS",
        entity_type="Settings",
        entity_id=None,
        status="SUCCESS",
        metadata_json=settings.dict(exclude_unset=True)
    )
    
    return SettingsResponse(
        review_message_template=template,
        auto_send_sms=auto_send,
        campaign_inactive_days=inactive_days
    )
