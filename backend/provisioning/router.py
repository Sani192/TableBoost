from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.database import get_db
from modules.auth.router import get_current_user
from provisioning.schemas import ProvisionRequest, ProvisionResponse, ValidateResponse
from provisioning.service import execute_provisioning_pipeline
from provisioning.validators import validate_tenant_health

router = APIRouter(prefix="/internal/admin", tags=["Platform Provisioning"])

@router.post("/provision-restaurant", response_model=ProvisionResponse)
def provision_restaurant_endpoint(
    req: ProvisionRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Enforce SUPER_ADMIN role
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access platform administration APIs"
        )

    # 2. Run the provisioning pipeline
    try:
        response = execute_provisioning_pipeline(db, req, actor_user=current_user)
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during restaurant provisioning: {str(e)}"
        )

@router.get("/validate-restaurant", response_model=ValidateResponse)
def validate_restaurant_endpoint(
    restaurant_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Enforce SUPER_ADMIN role
    if current_user.role != "SUPER_ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access platform administration APIs"
        )

    # 2. Validate tenant health
    try:
        health_report = validate_tenant_health(db, restaurant_id)
        return health_report
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during tenant validation: {str(e)}"
        )
