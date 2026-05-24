from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func
from datetime import datetime
from typing import Optional, Dict, Any, List
from modules.governance.models import AuditLog, OperationalLog
import logging

logger = logging.getLogger(__name__)

from decimal import Decimal

def sanitize_metadata(data: Any) -> Any:
    """Recursively convert Decimals to floats and datetimes to ISO strings for JSON serialization."""
    if isinstance(data, dict):
        return {k: sanitize_metadata(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_metadata(v) for v in data]
    elif isinstance(data, Decimal):
        return float(data)
    elif isinstance(data, datetime):
        return data.isoformat()
    return data

def log_audit_event(
    db: Session,
    restaurant_id: Optional[int] = None,
    actor_id: Optional[int] = None,
    actor_username: Optional[str] = None,
    action: str = "",
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    status: str = "",
    metadata_json: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """Log a user activity audit event to the database"""
    try:
        if metadata_json:
            metadata_json = sanitize_metadata(metadata_json)
        log_entry = AuditLog(
            restaurant_id=restaurant_id,
            actor_id=actor_id,
            actor_username=actor_username,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            status=status,
            metadata_json=metadata_json
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        logger.error(f"Failed to log audit event: {e}", exc_info=True)
        # Avoid breaking the main request flow if logging fails
        db.rollback()
        return None

def log_operational_event(
    db: Session,
    restaurant_id: Optional[int],
    log_type: str,
    event_name: str,
    status: str,
    job_id: Optional[str] = None,
    message: Optional[str] = None,
    duration_ms: Optional[int] = None,
    metadata_json: Optional[Dict[str, Any]] = None
) -> OperationalLog:
    """Log a background job/automation operational event to the database"""
    try:
        if metadata_json:
            metadata_json = sanitize_metadata(metadata_json)
        log_entry = OperationalLog(
            restaurant_id=restaurant_id,
            log_type=log_type,
            event_name=event_name,
            job_id=job_id,
            status=status,
            message=message,
            duration_ms=duration_ms,
            metadata_json=metadata_json
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry
    except Exception as e:
        logger.error(f"Failed to log operational event: {e}", exc_info=True)
        # Avoid breaking the background job flow if logging fails
        db.rollback()
        return None


def get_audit_logs(
    db: Session,
    restaurant_id: int,
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    actor_username: Optional[str] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    sort_by: Optional[str] = "timestamp",
    sort_dir: Optional[str] = "desc"
):
    """Retrieve audit logs with paginated filtering and sorting"""
    query = db.query(AuditLog).filter(AuditLog.restaurant_id == restaurant_id)

    if actor_username:
        query = query.filter(AuditLog.actor_username == actor_username)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if status:
        query = query.filter(AuditLog.status == status)
    if start_date:
        query = query.filter(AuditLog.timestamp >= start_date)
    if end_date:
        query = query.filter(AuditLog.timestamp <= end_date)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                AuditLog.actor_username.ilike(search_filter),
                AuditLog.action.ilike(search_filter),
                AuditLog.entity_type.ilike(search_filter),
                AuditLog.entity_id.ilike(search_filter),
                AuditLog.status.ilike(search_filter)
            )
        )

    # Allowed sorting fields to prevent SQL injection
    sort_map = {
        "id": AuditLog.id,
        "actor_username": AuditLog.actor_username,
        "action": AuditLog.action,
        "entity_type": AuditLog.entity_type,
        "status": AuditLog.status,
        "timestamp": AuditLog.timestamp
    }
    
    sort_col = sort_map.get(sort_by, AuditLog.timestamp)
    if sort_dir == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    total = query.count()
    pages = (total + limit - 1) // limit if total > 0 else 1
    items = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": pages
    }

def get_operational_logs(
    db: Session,
    restaurant_id: int,
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    log_type: Optional[str] = None,
    event_name: Optional[str] = None,
    job_id: Optional[str] = None,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    sort_by: Optional[str] = "timestamp",
    sort_dir: Optional[str] = "desc"
):
    """Retrieve operational logs with paginated filtering and sorting"""
    query = db.query(OperationalLog).filter(OperationalLog.restaurant_id == restaurant_id)

    if log_type:
        query = query.filter(OperationalLog.log_type == log_type)
    if event_name:
        query = query.filter(OperationalLog.event_name == event_name)
    if job_id:
        query = query.filter(OperationalLog.job_id == job_id)
    if status:
        query = query.filter(OperationalLog.status == status)
    if start_date:
        query = query.filter(OperationalLog.timestamp >= start_date)
    if end_date:
        query = query.filter(OperationalLog.timestamp <= end_date)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                OperationalLog.log_type.ilike(search_filter),
                OperationalLog.event_name.ilike(search_filter),
                OperationalLog.job_id.ilike(search_filter),
                OperationalLog.status.ilike(search_filter),
                OperationalLog.message.ilike(search_filter)
            )
        )

    # Allowed sorting fields to prevent SQL injection
    sort_map = {
        "id": OperationalLog.id,
        "log_type": OperationalLog.log_type,
        "event_name": OperationalLog.event_name,
        "message": OperationalLog.message,
        "status": OperationalLog.status,
        "timestamp": OperationalLog.timestamp
    }

    sort_col = sort_map.get(sort_by, OperationalLog.timestamp)
    if sort_dir == "asc":
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    total = query.count()
    pages = (total + limit - 1) // limit if total > 0 else 1
    items = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "items": items,
        "total": total,
        "page": page,
        "pages": pages
    }
