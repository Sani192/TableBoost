from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from modules.dashboard.schemas import DashboardResponse
from modules.dashboard import service
from modules.auth.router import get_current_tenant, check_role

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardResponse)
def get_dashboard(
    tenant_context = Depends(check_role(["OWNER", "MANAGER"])),
    db: Session = Depends(get_db)
):
    current_user = tenant_context["user"]
    restaurant_id = tenant_context["restaurant_id"]
    features = current_user.get_features(restaurant_id)
    has_loyalty = "loyalty" in features
    has_intel = "intelligence" in features
    return service.get_dashboard_stats(db, restaurant_id, has_loyalty=has_loyalty, has_intel=has_intel)

