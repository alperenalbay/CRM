from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, require_permissions
from app.models.customer import Customer
from app.models.sales import SalesOrder
from app.models.task import Task
from app.models.ticket import Ticket
from app.models.user import User
from app.models.workflow import WorkflowState
from app.schemas.ticket import TicketOut
from app.services import ticket as ticket_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("dashboard.view")),
) -> dict:
    customer_count = db.scalar(
        select(func.count(Customer.id)).where(Customer.is_active == True)
    )
    open_ticket_count = db.scalar(
        select(func.count(Ticket.id))
        .join(WorkflowState, Ticket.status_id == WorkflowState.id)
        .where(Ticket.is_active == True, WorkflowState.code != "ticket_closed")
    )
    closed_ticket_count = db.scalar(
        select(func.count(Ticket.id))
        .join(WorkflowState, Ticket.status_id == WorkflowState.id)
        .where(Ticket.is_active == True, WorkflowState.code == "ticket_closed")
    )
    open_task_count = db.scalar(
        select(func.count(Task.id))
        .join(WorkflowState, Task.status_id == WorkflowState.id)
        .where(Task.is_active == True, WorkflowState.code != "task_done")
    )
    sales_total = db.scalar(
        select(func.coalesce(func.sum(SalesOrder.total_amount), 0)).where(
            SalesOrder.is_active == True
        )
    )
    order_count = db.scalar(
        select(func.count(SalesOrder.id)).where(SalesOrder.is_active == True)
    )

    recent_tickets = db.scalars(
        select(Ticket)
        .options(
            selectinload(Ticket.customer),
            selectinload(Ticket.status),
            selectinload(Ticket.assignee),
            selectinload(Ticket.creator),
        )
        .where(Ticket.is_active == True)
        .order_by(Ticket.id.desc())
        .limit(5)
    ).all()

    return {
        "customer_count": customer_count or 0,
        "open_ticket_count": open_ticket_count or 0,
        "closed_ticket_count": closed_ticket_count or 0,
        "open_task_count": open_task_count or 0,
        "sales_total": float(sales_total or 0),
        "order_count": order_count or 0,
        "recent_tickets": [
            ticket_service.ticket_out(t) for t in recent_tickets
        ],
    }
