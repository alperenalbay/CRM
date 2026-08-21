from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.customer import Customer
from app.models.sales import Product, SalesOrder, SalesOrderItem
from app.models.user import User
from app.schemas.sales import (
    ProductCreate,
    SalesOrderCreate,
    SalesOrderDetailOut,
    SalesOrderItemOut,
    SalesOrderOut,
)


def _display_name(user: User | None) -> str | None:
    if user is None:
        return None
    return user.full_name or user.username


def generate_order_code(db: Session) -> str:
    last = db.scalar(select(SalesOrder.order_no).order_by(SalesOrder.id.desc()).limit(1))
    next_number = 1
    if last:
        try:
            next_number = int(last.split("-")[-1]) + 1
        except ValueError:
            next_number = 1
    return f"SO-{next_number:05d}"


def create_product(db: Session, payload: ProductCreate) -> Product:
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product: Product, payload) -> Product:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def create_order(db: Session, payload: SalesOrderCreate, user: User) -> SalesOrder:
    customer = db.get(Customer, payload.customer_id)
    if customer is None or not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Müşteri bulunamadı."
        )
    order = SalesOrder(
        order_no=generate_order_code(db),
        customer_id=payload.customer_id,
        order_date=payload.order_date or date.today(),
        status=payload.status,
        created_by=user.id,
    )
    db.add(order)
    db.flush()
    total = 0.0
    for item in payload.items:
        product = db.get(Product, item.product_id)
        if product is None or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ürün bulunamadı: {item.product_id}",
            )
        unit_price = item.unit_price if item.unit_price is not None else float(product.unit_price)
        line_total = round(unit_price * item.quantity, 2)
        total += line_total
        db.add(
            SalesOrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=unit_price,
                line_total=line_total,
            )
        )
    order.total_amount = round(total, 2)
    db.commit()
    db.refresh(order)
    return order


def order_out(db: Session, order: SalesOrder) -> SalesOrderOut:
    return SalesOrderOut(
        id=order.id,
        order_no=order.order_no,
        customer_id=order.customer_id,
        customer_name=order.customer.company_name if order.customer else None,
        order_date=order.order_date,
        total_amount=float(order.total_amount),
        status=order.status,
        created_by_name=_display_name(order.creator),
        created_at=order.created_at,
    )


def build_order_detail(db: Session, order: SalesOrder) -> SalesOrderDetailOut:
    base = order_out(db, order)
    return SalesOrderDetailOut(
        **base.model_dump(),
        items=[
            SalesOrderItemOut(
                id=item.id,
                product_id=item.product_id,
                product_code=item.product.code if item.product else None,
                product_name=item.product.name if item.product else None,
                quantity=float(item.quantity),
                unit_price=float(item.unit_price),
                line_total=float(item.line_total),
            )
            for item in order.items
        ],
    )
