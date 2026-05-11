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
    db: Session = Depends(get_db)
):
    return service.get_customers(
        db, skip=skip, limit=limit, search=search,
        min_visits=min_visits, max_visits=max_visits,
        min_spent=min_spent, max_spent=max_spent
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
