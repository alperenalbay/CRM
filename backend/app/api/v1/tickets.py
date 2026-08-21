from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, require_permissions
from app.models.customer import Customer
from app.models.ticket import Ticket, TicketActivity
from app.models.user import User
from app.schemas.ticket import (
    TicketActivityOut,
    TicketCommentIn,
    TicketCreate,
    TicketDetailOut,
    TicketOut,
    TicketStatusIn,
    TicketTransferIn,
    TicketUpdate,
)
from app.services import ticket as ticket_service

router = APIRouter(prefix="/tickets", tags=["tickets"])

TICKET_OPTIONS = (
    selectinload(Ticket.customer),
    selectinload(Ticket.status),
    selectinload(Ticket.assignee),
    selectinload(Ticket.creator),
)


def _get_ticket_or_404(db: Session, ticket_id: int) -> Ticket:
    ticket = db.scalar(
        select(Ticket)
        .options(*TICKET_OPTIONS)
        .where(Ticket.id == ticket_id, Ticket.is_active == True)
    )
    if ticket is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Kayıt bulunamadı."
        )
    return ticket


@router.get("", response_model=list[TicketOut])
def list_tickets(
    q: str | None = None,
    status_code: str | None = None,
    priority: str | None = None,
    assigned_to: int | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tickets.view")),
) -> list[TicketOut]:
    stmt = select(Ticket).options(*TICKET_OPTIONS).where(Ticket.is_active == True)
    if q:
        pattern = f"%{q}%"
        stmt = stmt.join(Customer, Ticket.customer_id == Customer.id).where(
            or_(
                Ticket.subject.ilike(pattern),
                Ticket.ticket_no.ilike(pattern),
                Customer.company_name.ilike(pattern),
            )
        )
    if status_code:
        stmt = stmt.where(Ticket.status.has(code=status_code))
    if priority:
        stmt = stmt.where(Ticket.priority == priority)
    if assigned_to:
        stmt = stmt.where(Ticket.assigned_to_id == assigned_to)
    stmt = stmt.order_by(Ticket.id.desc()).offset(skip).limit(limit)
    tickets = db.scalars(stmt).all()
    return [ticket_service.ticket_out(t) for t in tickets]


@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    payload: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tickets.create")),
) -> TicketOut:
    ticket = ticket_service.create_ticket(db, payload, current_user)
    return ticket_service.ticket_out(ticket)


@router.get("/{ticket_id}", response_model=TicketOut)
def get_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tickets.view")),
) -> TicketOut:
    return ticket_service.ticket_out(_get_ticket_or_404(db, ticket_id))


@router.get("/{ticket_id}/detail", response_model=TicketDetailOut)
def get_ticket_detail(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tickets.view")),
) -> TicketDetailOut:
    ticket = _get_ticket_or_404(db, ticket_id)
    return ticket_service.build_detail(db, ticket)


@router.patch("/{ticket_id}", response_model=TicketOut)
def update_ticket(
    ticket_id: int,
    payload: TicketUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tickets.update")),
) -> TicketOut:
    ticket = _get_ticket_or_404(db, ticket_id)
    return ticket_service.ticket_out(ticket_service.update_ticket(db, ticket, payload))


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tickets.delete")),
) -> None:
    ticket = _get_ticket_or_404(db, ticket_id)
    ticket.is_active = False
    db.commit()


@router.post("/{ticket_id}/status", response_model=TicketOut)
def change_ticket_status(
    ticket_id: int,
    payload: TicketStatusIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tickets.change_status")),
) -> TicketOut:
    ticket = _get_ticket_or_404(db, ticket_id)
    updated = ticket_service.change_status(
        db, ticket, payload.status_code, payload.comment, current_user
    )
    return ticket_service.ticket_out(updated)


@router.post("/{ticket_id}/transfer", response_model=TicketOut)
def transfer_ticket(
    ticket_id: int,
    payload: TicketTransferIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tickets.transfer")),
) -> TicketOut:
    ticket = _get_ticket_or_404(db, ticket_id)
    updated = ticket_service.transfer(
        db, ticket, payload.to_user_id, payload.reason, current_user
    )
    return ticket_service.ticket_out(updated)


@router.post("/{ticket_id}/comments", response_model=TicketActivityOut)
def add_ticket_comment(
    ticket_id: int,
    payload: TicketCommentIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tickets.update")),
) -> TicketActivityOut:
    ticket = _get_ticket_or_404(db, ticket_id)
    activity = ticket_service.add_comment(db, ticket, payload.comment, current_user)
    return TicketActivityOut(
        id=activity.id,
        user_name=current_user.full_name or current_user.username,
        action=activity.action,
        detail=activity.detail,
        created_at=activity.created_at,
    )
