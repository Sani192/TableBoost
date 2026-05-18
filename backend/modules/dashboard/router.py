from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from modules.dashboard.schemas import DashboardResponse
from modules.dashboard import service
from modules.auth.router import get_current_user, check_role

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/", response_model=DashboardResponse, dependencies=[Depends(check_role(["OWNER", "MANAGER"]))])
def get_dashboard(db: Session = Depends(get_db)):
    return service.get_dashboard_stats(db)

