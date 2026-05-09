import logging
from sqlalchemy.orm import Session
from modules.messaging.models import Message
from modules.settings import service as settings_service

logger = logging.getLogger(__name__)

DEFAULT_TEMPLATE = "Hi {name}, thanks for visiting! Please leave us a review: https://g.page/r/example/review"

def trigger_review_sms(db: Session, customer_id: int, customer_name: str = None):
    # Read template from settings, fall back to default
    template = settings_service.get_setting(db, "review_message_template", default=DEFAULT_TEMPLATE)
    message_content = template.replace("{name}", customer_name or "there")

    # Attempt to send SMS (placeholder for actual gateway)
    try:
        print(f"SMS SENT to customer {customer_id}: {message_content}")
        status = "sent"
    except Exception as e:
        logger.error(f"SMS gateway failed for customer {customer_id}: {e}", exc_info=True)
        status = "failed"

    # Always log the message in the database
    new_message = Message(
        customer_id=customer_id,
        message_text=message_content,
        type="review",
        status=status,
    )
    db.add(new_message)
    db.flush()

    return status

