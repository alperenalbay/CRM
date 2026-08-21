from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, require_permissions
from app.models.customer import Customer
from app.models.user import User
from app.schemas.customer import (
    CustomerCreate,
    CustomerHistoryOut,
    CustomerOut,
    CustomerUpdate,
)
from app.services import customer as customer_service

router = APIRouter(prefix="/customers", tags=["customers"])


def _get_customer_or_404(db: Session, customer_id: int) -> Customer:
    customer = db.scalar(
        select(Customer)
        .options(selectinload(Customer.contacts))
        .where(Customer.id == customer_id, Customer.is_active == True)
    )
    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Müşteri bulunamadı.",
        )
    return customer


@router.get("/search", response_model=list[CustomerOut])
def search_customers(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("customers.view")),
) -> list[Customer]:
    stmt = (
        select(Customer)
        .options(selectinload(Customer.contacts))
        .where(Customer.is_active == True)
    )
    if q.strip():
        pattern = f"%{q}%"
        stmt = stmt.where(
            or_(
                Customer.company_name.ilike(pattern),
                Customer.customer_code.ilike(pattern),
                Customer.tax_no.ilike(pattern),
                Customer.email.ilike(pattern),
                Customer.phone.ilike(pattern),
            )
        )
    stmt = stmt.order_by(Customer.company_name).limit(20)
    return list(db.scalars(stmt))


@router.get("", response_model=list[CustomerOut])
def list_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("customers.view")),
    skip: int = 0,
    limit: int = 50,
) -> list[Customer]:
    stmt = (
        select(Customer)
        .options(selectinload(Customer.contacts))
        .where(Customer.is_active == True)
        .order_by(Customer.id.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(db.scalars(stmt))


@router.post("", response_model=CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("customers.create")),
) -> Customer:
    return customer_service.create_customer(db, payload)


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("customers.view")),
) -> Customer:
    return _get_customer_or_404(db, customer_id)


@router.get("/{customer_id}/history", response_model=CustomerHistoryOut)
def get_customer_history(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("customers.view")),
) -> CustomerHistoryOut:
    customer = _get_customer_or_404(db, customer_id)
    return customer_service.build_history(db, customer)


@router.patch("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    payload: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("customers.update")),
) -> Customer:
    customer = _get_customer_or_404(db, customer_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("customers.delete")),
) -> None:
    customer = _get_customer_or_404(db, customer_id)
    customer.is_active = False
    db.commit()
