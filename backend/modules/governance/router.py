from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from modules.auth.router import check_role, check_feature
from modules.governance import schemas, service
from typing import Optional
from datetime import datetime

router = APIRouter(prefix="/api/governance", tags=["Governance"])

@router.get(
    "/audit",
    response_model=schemas.PaginatedAuditLogs,
    dependencies=[Depends(check_role(["OWNER"])), Depends(check_feature("governance"))]
)
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    actor_username: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    sort_by: Optional[str] = Query("timestamp"),
    sort_dir: Optional[str] = Query("desc"),
    db: Session = Depends(get_db)
):
    """Retrieve user activity audit logs. Only accessible to OWNER role with PRO subscription."""
    return service.get_audit_logs(
        db=db,
        page=page,
        limit=limit,
        search=search,
        actor_username=actor_username,
        action=action,
        entity_type=entity_type,
        status=status,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_dir=sort_dir
    )

@router.get(
    "/operational",
    response_model=schemas.PaginatedOperationalLogs,
    dependencies=[Depends(check_role(["OWNER", "MANAGER"])), Depends(check_feature("governance"))]
)
def get_operational_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    log_type: Optional[str] = Query(None),
    event_name: Optional[str] = Query(None),
    job_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    sort_by: Optional[str] = Query("timestamp"),
    sort_dir: Optional[str] = Query("desc"),
    db: Session = Depends(get_db)
):
    """Retrieve system & background operational logs. Accessible to OWNER and MANAGER roles with PRO subscription."""
    return service.get_operational_logs(
        db=db,
        page=page,
        limit=limit,
        search=search,
        log_type=log_type,
        event_name=event_name,
        job_id=job_id,
        status=status,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_dir=sort_dir
    )
