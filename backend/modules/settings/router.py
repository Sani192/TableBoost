from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from modules.settings.schemas import SettingsResponse, SettingsUpdate
from modules.settings import service
from modules.messaging.service import DEFAULT_TEMPLATE
from modules.auth.router import get_current_tenant, check_role
from modules.governance.service import log_audit_event

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("/", response_model=SettingsResponse)
def get_settings(
    tenant_context = Depends(check_role(["OWNER"])),
    db: Session = Depends(get_db)
):
    restaurant_id = tenant_context["restaurant_id"]
    template = service.get_setting(db, restaurant_id, "review_message_template", default=DEFAULT_TEMPLATE)
    auto_send = service.get_setting(db, restaurant_id, "auto_send_sms", default=True)
    inactive_days = int(service.get_setting(db, restaurant_id, "campaign_inactive_days", default=30))
    return SettingsResponse(
        review_message_template=template,
        auto_send_sms=auto_send,
        campaign_inactive_days=inactive_days
    )

@router.post("/", response_model=SettingsResponse)
def update_settings(
    settings: SettingsUpdate, 
    tenant_context = Depends(check_role(["OWNER"])), 
    db: Session = Depends(get_db)
):
    current_user = tenant_context["user"]
    restaurant_id = tenant_context["restaurant_id"]
    
    if settings.review_message_template is not None:
        service.set_setting(db, restaurant_id, "review_message_template", settings.review_message_template)
    if settings.auto_send_sms is not None:
        service.set_setting(db, restaurant_id, "auto_send_sms", settings.auto_send_sms)
    if settings.campaign_inactive_days is not None:
        service.set_setting(db, restaurant_id, "campaign_inactive_days", settings.campaign_inactive_days)
        
    template = service.get_setting(db, restaurant_id, "review_message_template", default=DEFAULT_TEMPLATE)
    auto_send = service.get_setting(db, restaurant_id, "auto_send_sms", default=True)
    inactive_days = int(service.get_setting(db, restaurant_id, "campaign_inactive_days", default=30))
    
    log_audit_event(
        db,
        restaurant_id,
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
