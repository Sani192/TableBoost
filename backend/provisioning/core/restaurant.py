import zoneinfo
from sqlalchemy.orm import Session
from modules.restaurants.models import Restaurant
from modules.settings.models import Setting
from modules.messaging.service import DEFAULT_TEMPLATE

def validate_timezone(tz_name: str) -> bool:
    try:
        zoneinfo.ZoneInfo(tz_name)
        return True
    except Exception:
        return False

def set_setting_transactional(db: Session, restaurant_id: int, key: str, value) -> Setting:
    setting = db.query(Setting).filter(Setting.restaurant_id == restaurant_id, Setting.key == key).first()
    if not setting:
        setting = Setting(restaurant_id=restaurant_id, key=key)
        db.add(setting)
    
    if isinstance(value, bool):
        setting.value_bool = value
        setting.value_str = None
    else:
        setting.value_str = str(value)
        setting.value_bool = None
    
    db.flush()
    return setting

def provision_restaurant(db: Session, name: str, timezone: str, actions_taken: list) -> Restaurant:
    # 1. Validate timezone
    if not validate_timezone(timezone):
        raise ValueError(f"Invalid timezone: {timezone}")

    # 2. Check if restaurant with same name already exists
    # Perform case-insensitive check
    restaurant = db.query(Restaurant).filter(Restaurant.name.ilike(name)).first()
    if restaurant:
        actions_taken.append(f"Found existing restaurant: {restaurant.name} (ID: {restaurant.id})")
        return restaurant

    # 3. Create new restaurant
    restaurant = Restaurant(
        name=name,
        timezone=timezone,
        status="ACTIVE"
    )
    db.add(restaurant)
    db.flush() # Populate ID

    actions_taken.append(f"Created new restaurant: {name} (ID: {restaurant.id})")

    # 4. Seed default settings
    set_setting_transactional(db, restaurant.id, "review_message_template", DEFAULT_TEMPLATE)
    set_setting_transactional(db, restaurant.id, "auto_send_sms", True)
    set_setting_transactional(db, restaurant.id, "campaign_inactive_days", 30)

    actions_taken.append("Seeded default settings: review_message_template, auto_send_sms, campaign_inactive_days")

    return restaurant
