import os

# 1. Update schemas.py
schemas_path = "backend/modules/customers/schemas.py"
with open(schemas_path, 'r') as f:
    content = f.read()

content = content.replace("class CustomerDetailResponse(CustomerListResponse):\n    visits: List[VisitMinimal] = []", 
                          "class CustomerDetailResponse(CustomerListResponse):\n    pass")
with open(schemas_path, 'w') as f:
    f.write(content)

# 2. Update service.py
service_path = "backend/modules/customers/service.py"
with open(service_path, 'r') as f:
    content = f.read()

# Add min_visits, max_visits, min_spent, max_spent to get_customers
old_get_customers_def = """def get_customers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None
):"""
new_get_customers_def = """def get_customers(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    min_visits: Optional[int] = None,
    max_visits: Optional[int] = None,
    min_spent: Optional[float] = None,
    max_spent: Optional[float] = None
):"""
content = content.replace(old_get_customers_def, new_get_customers_def)

# Add HAVING clauses
having_code = """
    if min_visits is not None:
        query = query.having(func.count(Visit.id) >= min_visits)
    if max_visits is not None:
        query = query.having(func.count(Visit.id) <= max_visits)
    if min_spent is not None:
        query = query.having(func.sum(Visit.amount) >= min_spent)
    if max_spent is not None:
        query = query.having(func.sum(Visit.amount) <= max_spent)
        
    query = query.order_by(func.max(Visit.visited_at).desc().nulls_last())
"""
content = content.replace("    query = query.order_by(func.max(Visit.visited_at).desc().nulls_last())", having_code)

# Remove .all() in get_customer_detail
old_detail_code = """    visits = db.query(Visit).filter(Visit.customer_id == customer_id).order_by(Visit.visited_at.desc()).all()
    
    visit_list = [{
        "id": v.id,
        "amount": v.amount,
        "visited_at": v.visited_at
    } for v in visits]
    
    return {
        "id": customer.id,
        "phone_number": customer.phone_number,
        "name": customer.name,
        "created_at": customer.created_at,
        "total_visits": total_visits or 0,
        "last_visit": last_visit,
        "total_spent": total_spent or 0.0,
        "visits": visit_list
    }"""
new_detail_code = """    return {
        "id": customer.id,
        "phone_number": customer.phone_number,
        "name": customer.name,
        "created_at": customer.created_at,
        "total_visits": total_visits or 0,
        "last_visit": last_visit,
        "total_spent": total_spent or 0.0
    }

def get_customer_visits(db: Session, customer_id: int, skip: int = 0, limit: int = 20):
    visits = db.query(Visit).filter(Visit.customer_id == customer_id).order_by(Visit.visited_at.desc()).offset(skip).limit(limit).all()
    return [{
        "id": v.id,
        "amount": v.amount,
        "visited_at": v.visited_at
    } for v in visits]"""
content = content.replace(old_detail_code, new_detail_code)

with open(service_path, 'w') as f:
    f.write(content)

# 3. Update router.py
router_path = "backend/modules/customers/router.py"
with open(router_path, 'r') as f:
    content = f.read()

old_router_def = """def list_customers(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return service.get_customers(db, skip=skip, limit=limit, search=search)"""
new_router_def = """def list_customers(
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
    )"""
content = content.replace(old_router_def, new_router_def)

new_visits_route = """@router.get("/{customer_id}/visits", response_model=List[schemas.VisitMinimal])
def get_customer_visits(customer_id: int, skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    return service.get_customer_visits(db, customer_id, skip=skip, limit=limit)"""

content = content + "\n\n" + new_visits_route + "\n"

with open(router_path, 'w') as f:
    f.write(content)

print("Customers backend updated successfully.")
