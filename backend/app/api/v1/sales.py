from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, require_permissions
from app.models.sales import Product, SalesOrder, SalesOrderItem
from app.models.user import User
from app.schemas.sales import (
    ProductCreate,
    ProductOut,
    ProductUpdate,
    SalesOrderCreate,
    SalesOrderDetailOut,
    SalesOrderOut,
    SalesOrderUpdate,
)
from app.services import sales as sales_service

router = APIRouter(tags=["sales"])


def _get_order_or_404(db: Session, order_id: int) -> SalesOrder:
    order = db.scalar(
        select(SalesOrder)
        .options(
            selectinload(SalesOrder.customer),
            selectinload(SalesOrder.creator),
            selectinload(SalesOrder.items).selectinload(SalesOrderItem.product),
        )
        .where(SalesOrder.id == order_id, SalesOrder.is_active == True)
    )
    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Satış emri bulunamadı."
        )
    return order


@router.get("/products", response_model=list[ProductOut])
def list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("products.view")),
) -> list[Product]:
    stmt = select(Product).order_by(Product.is_active.desc(), Product.code)
    return list(db.scalars(stmt))


@router.post("/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("products.create")),
) -> Product:
    return sales_service.create_product(db, payload)


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("products.update")),
) -> Product:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ürün bulunamadı."
        )
    return sales_service.update_product(db, product, payload)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("products.update")),
) -> None:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ürün bulunamadı."
        )
    product.is_active = False
    db.commit()


@router.get("/orders", response_model=list[SalesOrderOut])
def list_orders(
    customer_id: int | None = None,
    status: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("sales.view")),
) -> list[SalesOrderOut]:
    stmt = (
        select(SalesOrder)
        .options(selectinload(SalesOrder.customer), selectinload(SalesOrder.creator))
        .where(SalesOrder.is_active == True)
    )
    if customer_id:
        stmt = stmt.where(SalesOrder.customer_id == customer_id)
    if status:
        stmt = stmt.where(SalesOrder.status == status)
    stmt = stmt.order_by(SalesOrder.id.desc()).offset(skip).limit(limit)
    orders = db.scalars(stmt).all()
    return [sales_service.order_out(db, order) for order in orders]


@router.post("/orders", response_model=SalesOrderDetailOut, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("sales.create")),
) -> SalesOrderDetailOut:
    order = sales_service.create_order(db, payload, current_user)
    return sales_service.build_order_detail(db, _get_order_or_404(db, order.id))


@router.get("/orders/{order_id}", response_model=SalesOrderDetailOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("sales.view")),
) -> SalesOrderDetailOut:
    return sales_service.build_order_detail(db, _get_order_or_404(db, order_id))


@router.patch("/orders/{order_id}", response_model=SalesOrderOut)
def update_order(
    order_id: int,
    payload: SalesOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("sales.update")),
) -> SalesOrderOut:
    order = _get_order_or_404(db, order_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(order, field, value)
    db.commit()
    db.refresh(order)
    return sales_service.order_out(db, order)


@router.delete("/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("sales.delete")),
) -> None:
    order = _get_order_or_404(db, order_id)
    order.is_active = False
    db.commit()
