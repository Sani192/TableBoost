from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional, Any

class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    actor_id: Optional[int] = None
    actor_username: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    status: str
    metadata_json: Optional[Any] = None

    class Config:
        from_attributes = True

class OperationalLogResponse(BaseModel):
    id: int
    timestamp: datetime
    log_type: str
    event_name: str
    job_id: Optional[str] = None
    status: str
    message: Optional[str] = None
    duration_ms: Optional[int] = None
    metadata_json: Optional[Any] = None

    class Config:
        from_attributes = True

class PaginatedAuditLogs(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    pages: int

class PaginatedOperationalLogs(BaseModel):
    items: List[OperationalLogResponse]
    total: int
    page: int
    pages: int
