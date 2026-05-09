from sqlalchemy.orm import Session
from modules.settings.models import Setting

def get_setting(db: Session, key: str, default=None):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        return default
    
    if setting.value_bool is not None:
        return setting.value_bool
    return setting.value_str or default

def set_setting(db: Session, key: str, value):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if not setting:
        setting = Setting(key=key)
        db.add(setting)
    
    if isinstance(value, bool):
        setting.value_bool = value
    else:
        setting.value_str = str(value)
    
    db.commit()
    db.refresh(setting)
    return setting
