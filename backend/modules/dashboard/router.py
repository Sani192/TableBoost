from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from modules.dashboard.schemas import DashboardResponse
from modules.dashboard import service

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    return service.get_dashboard_stats(db)

