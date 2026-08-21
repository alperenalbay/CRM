from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.customer import Customer
from app.models.sales import SalesOrder
from app.models.ticket import Ticket
from app.schemas.customer import (
    CustomerCreate,
    CustomerHistoryOut,
    CustomerOut,
    OrderHistoryOut,
    TicketHistoryOut,
)

HISTORY_LIMIT = 10


def generate_customer_code(db: Session) -> str:
    last = db.scalar(select(Customer.customer_code).order_by(Customer.id.desc()).limit(1))
    next_number = 1
    if last:
        try:
            next_number = int(last.split("-")[-1]) + 1
        except ValueError:
            next_number = 1
    return f"CUS-{next_number:05d}"


def create_customer(db: Session, payload: CustomerCreate) -> Customer:
    customer = Customer(
        customer_code=generate_customer_code(db),
        **payload.model_dump(),
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def build_history(db: Session, customer: Customer) -> CustomerHistoryOut:
    tickets = db.scalars(
        select(Ticket)
        .where(Ticket.customer_id == customer.id, Ticket.is_active == True)
        .order_by(Ticket.id.desc())
        .limit(HISTORY_LIMIT)
    ).all()
    orders = db.scalars(
        select(SalesOrder)
        .where(SalesOrder.customer_id == customer.id, SalesOrder.is_active == True)
        .order_by(SalesOrder.id.desc())
        .limit(HISTORY_LIMIT)
    ).all()

    return CustomerHistoryOut(
        customer=CustomerOut.model_validate(customer),
        tickets=[
            TicketHistoryOut(
                id=t.id,
                ticket_no=t.ticket_no,
                subject=t.subject,
                priority=t.priority,
                status_name=t.status.name if t.status else None,
                created_at=t.created_at,
            )
            for t in tickets
        ],
        orders=[
            OrderHistoryOut(
                id=o.id,
                order_no=o.order_no,
                order_date=o.order_date,
                total_amount=o.total_amount,
                status=o.status,
            )
            for o in orders
        ],
    )
