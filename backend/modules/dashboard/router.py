from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from modules.dashboard.schemas import DashboardResponse
from modules.dashboard import service
from modules.auth.router import get_current_user, check_role

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/", response_model=DashboardResponse)
def get_dashboard(
    current_user = Depends(check_role(["OWNER", "MANAGER"])),
    db: Session = Depends(get_db)
):
    has_loyalty = "loyalty" in current_user.features
    has_intel = "intelligence" in current_user.features
    return service.get_dashboard_stats(db, has_loyalty=has_loyalty, has_intel=has_intel)

