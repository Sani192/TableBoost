import pytest
from core.decorators import resilient_job
import logging

def test_resilient_job_success():
    @resilient_job("Success Job")
    def my_job(x):
        return x * 2

    assert my_job(5) == 10

def test_resilient_job_failure(caplog):
    @resilient_job("Failing Job")
    def my_failing_job():
        raise ValueError("Simulated failure")

    with caplog.at_level(logging.ERROR):
        # We expect the wrapper to re-raise the exception after logging it
        with pytest.raises(ValueError):
            my_failing_job()
            
    assert "FATAL ERROR in job Failing Job" in caplog.text
