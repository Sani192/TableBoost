from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from modules.settings.schemas import SettingsResponse, SettingsUpdate
from modules.settings import service
from modules.messaging.service import DEFAULT_TEMPLATE

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("/", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    template = service.get_setting(db, "review_message_template", default=DEFAULT_TEMPLATE)
    auto_send = service.get_setting(db, "auto_send_sms", default=True)
    return SettingsResponse(
        review_message_template=template,
        auto_send_sms=auto_send
    )

@router.post("/", response_model=SettingsResponse)
def update_settings(settings: SettingsUpdate, db: Session = Depends(get_db)):
    if settings.review_message_template is not None:
        service.set_setting(db, "review_message_template", settings.review_message_template)
    if settings.auto_send_sms is not None:
        service.set_setting(db, "auto_send_sms", settings.auto_send_sms)
        
    template = service.get_setting(db, "review_message_template", default=DEFAULT_TEMPLATE)
    auto_send = service.get_setting(db, "auto_send_sms", default=True)
    return SettingsResponse(
        review_message_template=template,
        auto_send_sms=auto_send
    )
