from pydantic import BaseModel

class SettingsResponse(BaseModel):
    review_message_template: str
    auto_send_sms: bool
    campaign_inactive_days: int

class SettingsUpdate(BaseModel):
    review_message_template: str | None = None
    auto_send_sms: bool | None = None
    campaign_inactive_days: int | None = None
