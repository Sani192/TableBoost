from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from core.database import get_db
from modules.customers import schemas, service

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("/", response_model=List[schemas.CustomerListResponse])
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
    db: Session = Depends(get_db)
):
    return service.get_customers(
        db, skip=skip, limit=limit, search=search,
        min_visits=min_visits, max_visits=max_visits,
        min_spent=min_spent, max_spent=max_spent,
        birthday_month=birthday_month, birthday_day=birthday_day,
        anniversary_month=anniversary_month, anniversary_day=anniversary_day,
        is_celebrating_today=is_celebrating_today,
        is_vip=is_vip, is_at_risk=is_at_risk, is_reward_near=is_reward_near,
        is_lost=is_lost, is_new=is_new
    )

@router.get("/{customer_id}", response_model=schemas.CustomerDetailResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = service.get_customer_detail(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/{customer_id}/visits", response_model=List[schemas.VisitMinimal])
def get_customer_visits(customer_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return service.get_customer_visits(db, customer_id, skip=skip, limit=limit)

@router.patch("/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer(customer_id: int, customer_data: schemas.CustomerUpdate, db: Session = Depends(get_db)):
    customer = db.query(service.Customer).filter(service.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    data = customer_data.model_dump(exclude_unset=True)
    
    # Handle core customer fields
    for field in ["name", "phone_number"]:
        if field in data:
            setattr(customer, field, data[field])
            
    # Handle profile fields
    if "birthday" in data or "anniversary" in data:
        if not customer.profile:
            customer.profile = service.CustomerProfile(customer_id=customer.id)
            db.add(customer.profile)
            
        if "birthday" in data:
            customer.profile.birthday = data["birthday"]
        if "anniversary" in data:
            customer.profile.anniversary = data["anniversary"]
        
    db.commit()
    db.refresh(customer)
    return customer
