from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from modules.customers import schemas, service
from modules.auth.router import get_current_tenant, check_role

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("", response_model=List[schemas.CustomerListResponse])
def list_customers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    min_visits: Optional[int] = None,
    max_visits: Optional[int] = None,
    min_spent: Optional[float] = None,
    max_spent: Optional[float] = None,
    birthday_month: Optional[int] = None,
    birthday_day: Optional[int] = None,
    anniversary_month: Optional[int] = None,
    anniversary_day: Optional[int] = None,
    is_celebrating_today: Optional[bool] = None,
    is_vip: Optional[bool] = None,
    is_at_risk: Optional[bool] = None,
    is_reward_near: Optional[bool] = None,
    is_lost: Optional[bool] = None,
    is_new: Optional[bool] = None,
    tenant_context = Depends(check_role(["OWNER", "MANAGER"])),
    db: Session = Depends(get_db)
):
    user = tenant_context["user"]
    restaurant_id = tenant_context["restaurant_id"]
    features = user.get_features(restaurant_id)
    
    if is_vip and "smart_segments" not in features:
        raise HTTPException(status_code=403, detail="Filtering by VIP Customers requires the smart_segments feature.")
    if is_reward_near and "loyalty" not in features:
        raise HTTPException(status_code=403, detail="Filtering by Near Reward requires the loyalty feature.")
    if is_at_risk and "intelligence" not in features:
        raise HTTPException(status_code=403, detail="Filtering by At Risk requires the intelligence feature.")
    if is_lost and "intelligence" not in features:
        raise HTTPException(status_code=403, detail="Filtering by Lost requires the intelligence feature.")
    if is_new and "intelligence" not in features:
        raise HTTPException(status_code=403, detail="Filtering by New Customers requires the intelligence feature.")

    has_intel = "intelligence" in features
    has_loyalty = "loyalty" in features
    return service.get_customers(
        db, restaurant_id=restaurant_id, skip=skip, limit=limit, search=search,
        min_visits=min_visits, max_visits=max_visits,
        min_spent=min_spent, max_spent=max_spent,
        birthday_month=birthday_month, birthday_day=birthday_day,
        anniversary_month=anniversary_month, anniversary_day=anniversary_day,
        is_celebrating_today=is_celebrating_today,
        is_vip=is_vip, is_at_risk=is_at_risk, is_reward_near=is_reward_near,
        is_lost=is_lost, is_new=is_new,
        has_intel=has_intel, has_loyalty=has_loyalty
    )

@router.get("/{customer_id}", response_model=schemas.CustomerDetailResponse)
def get_customer(customer_id: int, tenant_context = Depends(get_current_tenant), db: Session = Depends(get_db)):
    customer = service.get_customer_detail(db, tenant_context["restaurant_id"], customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/{customer_id}/visits", response_model=List[schemas.VisitMinimal])
def get_customer_visits(customer_id: int, skip: int = 0, limit: int = 20, tenant_context = Depends(get_current_tenant), db: Session = Depends(get_db)):
    return service.get_customer_visits(db, tenant_context["restaurant_id"], customer_id, skip=skip, limit=limit)

from modules.governance.service import log_audit_event

@router.patch("/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer(
    customer_id: int, 
    customer_data: schemas.CustomerUpdate, 
    tenant_context = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    current_user = tenant_context["user"]
    restaurant_id = tenant_context["restaurant_id"]
    
    customer = db.query(service.Customer).filter(service.Customer.id == customer_id, service.Customer.restaurant_id == restaurant_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    def format_date(d):
        if not d:
            return None
        if hasattr(d, "isoformat"):
            return d.isoformat()
        return str(d)

    old_values = {
        "name": customer.name,
        "phone_number": customer.phone_number,
        "birthday": format_date(customer.profile.birthday) if customer.profile else None,
        "anniversary": format_date(customer.profile.anniversary) if customer.profile else None
    }

    data = customer_data.model_dump(exclude_unset=True)
    
    # Handle core customer fields
    for field in ["name", "phone_number"]:
        if field in data:
            setattr(customer, field, data[field])
            
    # Handle profile fields
    if "birthday" in data or "anniversary" in data:
        if not customer.profile:
            customer.profile = service.CustomerProfile(customer_id=customer.id, restaurant_id=restaurant_id)
            db.add(customer.profile)
            
        if "birthday" in data:
            customer.profile.birthday = data["birthday"]
        if "anniversary" in data:
            customer.profile.anniversary = data["anniversary"]
        
    db.commit()
    db.refresh(customer)
    
    new_values = {
        "name": customer.name,
        "phone_number": customer.phone_number,
        "birthday": format_date(customer.profile.birthday) if customer.profile else None,
        "anniversary": format_date(customer.profile.anniversary) if customer.profile else None
    }
    
    changed_fields = {}
    for key in old_values:
        if old_values[key] != new_values[key]:
            changed_fields[key] = {
                "old": old_values[key],
                "new": new_values[key]
            }

    log_audit_event(
        db,
        restaurant_id=restaurant_id,
        actor_id=current_user.id,
        actor_username=current_user.username,
        action="UPDATE_CUSTOMER",
        entity_type="Customer",
        entity_id=str(customer.id),
        status="SUCCESS",
        metadata_json={
            "changed_fields": changed_fields
        }
    )
    
    return customer
