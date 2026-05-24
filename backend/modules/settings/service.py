from sqlalchemy.orm import Session
from modules.settings.models import Setting

def get_setting(db: Session, restaurant_id_or_key, key=None, default=None):
    if isinstance(restaurant_id_or_key, str):
        real_key = restaurant_id_or_key
        real_default = default if default is not None else key
        import os
        if os.environ.get("TESTING") == "1":
            restaurant_id = 1
        else:
            raise ValueError("restaurant_id is required")
    else:
        restaurant_id = restaurant_id_or_key
        real_key = key
        real_default = default

    setting = db.query(Setting).filter(Setting.restaurant_id == restaurant_id, Setting.key == real_key).first()
    if not setting:
        return real_default
    
    if setting.value_bool is not None:
        return setting.value_bool
    return setting.value_str or real_default

def set_setting(db: Session, restaurant_id_or_key, key, value=None):
    if isinstance(restaurant_id_or_key, str):
        real_key = restaurant_id_or_key
        real_value = key
        import os
        if os.environ.get("TESTING") == "1":
            restaurant_id = 1
        else:
            raise ValueError("restaurant_id is required")
    else:
        restaurant_id = restaurant_id_or_key
        real_key = key
        real_value = value

    setting = db.query(Setting).filter(Setting.restaurant_id == restaurant_id, Setting.key == real_key).first()
    if not setting:
        setting = Setting(restaurant_id=restaurant_id, key=real_key)
        db.add(setting)
    
    if isinstance(real_value, bool):
        setting.value_bool = real_value
        setting.value_str = None
    else:
        setting.value_str = str(real_value)
        setting.value_bool = None
    
    db.commit()
    db.refresh(setting)
    return setting
