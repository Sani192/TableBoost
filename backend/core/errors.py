from typing import Any, Dict, Optional

class TableBoostError(Exception):
    """Base class for all application-specific errors in TableBoost."""
    def __init__(self, message: str, status_code: int = 500, payload: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.payload = payload or {}

class OperationalError(TableBoostError):
    """Raised when an expected operational constraint is violated (e.g., trying to do something invalid)."""
    def __init__(self, message: str, payload: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=400, payload=payload)

class ResourceNotFoundError(TableBoostError):
    """Raised when a requested resource does not exist."""
    def __init__(self, message: str, payload: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=404, payload=payload)

class AuthorizationError(TableBoostError):
    """Raised for RBAC or permission failures."""
    def __init__(self, message: str, payload: Optional[Dict[str, Any]] = None):
        super().__init__(message, status_code=403, payload=payload)
