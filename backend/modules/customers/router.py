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
    db: Session = Depends(get_db)
):
    return service.get_customers(db, skip=skip, limit=limit, search=search)

@router.get("/{customer_id}", response_model=schemas.CustomerDetailResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = service.get_customer_detail(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer
