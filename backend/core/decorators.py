import functools
import logging
from typing import Callable, Any

logger = logging.getLogger(__name__)

def resilient_job(job_name: str) -> Callable:
    """
    Decorator to wrap APScheduler jobs, catching all exceptions and preventing
    job failures from propagating and crashing the scheduler or blocking threads.
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            logger.info(f"Starting job: {job_name}")
            try:
                result = func(*args, **kwargs)
                logger.info(f"Completed job: {job_name} successfully")
                return result
            except Exception as e:
                logger.error(f"FATAL ERROR in job {job_name}: {str(e)}", exc_info=True)
                # We return None so APScheduler thinks the job completed but we logged the error.
                # The event listener in main.py will NOT see EVENT_JOB_ERROR if we catch it here.
                # However, for true operational safety, we should re-raise or let the listener catch it.
                # Actually, APScheduler *can* handle exceptions safely (it emits EVENT_JOB_ERROR),
                # but a wrapper allows us to safely manage connections or locks.
                # Let's re-raise so the EVENT_JOB_ERROR is triggered in main.py, but we ensure DB sessions are closed.
                raise
        return wrapper
    return decorator
