import uuid
import contextvars
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

# Thread-safe ContextVar to hold the active request's correlation ID
correlation_id_var = contextvars.ContextVar("correlation_id", default="-")

class CorrelationIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Fetch correlation ID from header or generate a new UUID
        correlation_id = request.headers.get("X-Correlation-ID")
        if not correlation_id:
            correlation_id = str(uuid.uuid4())
            
        # 2. Store in request.state for FastAPI handlers
        request.state.correlation_id = correlation_id
        
        # 3. Bind to ContextVar for structured logging
        token = correlation_id_var.set(correlation_id)
        try:
            response = await call_next(request)
        finally:
            correlation_id_var.reset(token)
            
        # 4. Return correlation ID in response headers
        response.headers["X-Correlation-ID"] = correlation_id
        return response

def get_correlation_id() -> str:
    """Helper to fetch the current correlation ID for logging."""
    return correlation_id_var.get()
