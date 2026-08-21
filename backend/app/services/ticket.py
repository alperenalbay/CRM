from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.ticket import (
    Ticket,
    TicketActivity,
    TicketStatusHistory,
    TicketTransfer,
)
from app.models.user import User
from app.models.workflow import WorkflowState
from app.schemas.ticket import (
    TicketActivityOut,
    TicketCreate,
    TicketDetailOut,
    TicketOut,
    TicketStatusHistoryOut,
    TicketTransferOut,
)


def _display_name(user: User | None) -> str | None:
    if user is None:
        return None
    return user.full_name or user.username


def _names(db: Session, ids: set[int]) -> dict[int, str]:
    if not ids:
        return {}
    users = db.scalars(select(User).where(User.id.in_(ids))).all()
    return {u.id: (u.full_name or u.username) for u in users}


def generate_ticket_code(db: Session) -> str:
    last = db.scalar(select(Ticket.ticket_no).order_by(Ticket.id.desc()).limit(1))
    next_number = 1
    if last:
        try:
            next_number = int(last.split("-")[-1]) + 1
        except ValueError:
            next_number = 1
    return f"TSK-{next_number:05d}"


def default_ticket_state(db: Session) -> WorkflowState:
    state = db.scalar(
        select(WorkflowState)
        .where(WorkflowState.category == "ticket", WorkflowState.is_default == True)
    )
    if state is None:
        state = db.scalar(
            select(WorkflowState)
            .where(WorkflowState.category == "ticket")
            .order_by(WorkflowState.sort_order)
        )
    if state is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Kayıt durumu tanımlı değil.",
        )
    return state


def get_state_by_code(db: Session, code: str) -> WorkflowState:
    state = db.scalar(
        select(WorkflowState)
        .where(WorkflowState.code == code, WorkflowState.is_active == True)
    )
    if state is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz durum kodu."
        )
    return state


def create_ticket(db: Session, payload: TicketCreate, user: User) -> Ticket:
    customer = db.get(Customer, payload.customer_id)
    if customer is None or not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Müşteri bulunamadı."
        )
    state = default_ticket_state(db)
    ticket = Ticket(
        ticket_no=generate_ticket_code(db),
        customer_id=payload.customer_id,
        subject=payload.subject,
        description=payload.description,
        priority=payload.priority or "medium",
        status_id=state.id,
        assigned_to_id=payload.assigned_to_id,
        created_by=user.id,
        due_at=payload.due_at,
    )
    db.add(ticket)
    db.flush()
    db.add(
        TicketActivity(
            ticket_id=ticket.id,
            user_id=user.id,
            action="created",
            detail=f"Kayıt oluşturuldu ({state.name}).",
        )
    )
    if payload.assigned_to_id:
        assignee = db.get(User, payload.assigned_to_id)
        db.add(
            TicketActivity(
                ticket_id=ticket.id,
                user_id=user.id,
                action="assigned",
                detail=f"Atandı: {_display_name(assignee)}.",
            )
        )
    db.commit()
    db.refresh(ticket)
    return ticket


def update_ticket(db: Session, ticket: Ticket, payload) -> Ticket:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(ticket, field, value)
    db.commit()
    db.refresh(ticket)
    return ticket


def change_status(
    db: Session, ticket: Ticket, status_code: str, comment: str | None, user: User
) -> Ticket:
    to_state = get_state_by_code(db, status_code)
    if to_state.category != "ticket":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kayıt durumu kategorisi geçersiz.",
        )
    if ticket.status_id == to_state.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kayıt zaten bu durumda.",
        )
    from_name = ticket.status.name if ticket.status else None
    db.add(
        TicketStatusHistory(
            ticket_id=ticket.id,
            from_status_id=ticket.status_id,
            to_status_id=to_state.id,
            changed_by=user.id,
            comment=comment,
        )
    )
    ticket.status_id = to_state.id
    if to_state.code == "ticket_closed":
        ticket.closed_at = datetime.utcnow()
    elif ticket.closed_at is not None:
        ticket.closed_at = None
    db.add(
        TicketActivity(
            ticket_id=ticket.id,
            user_id=user.id,
            action="status_changed",
            detail=f"{from_name} → {to_state.name}",
        )
    )
    db.commit()
    db.refresh(ticket)
    return ticket


def transfer(db: Session, ticket: Ticket, to_user_id: int, reason: str | None, user: User) -> Ticket:
    to_user = db.get(User, to_user_id)
    if to_user is None or not to_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Hedef kullanıcı bulunamadı."
        )
    if ticket.assigned_to_id == to_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kayıt zaten bu kullanıcıya atanmış.",
        )
    db.add(
        TicketTransfer(
            ticket_id=ticket.id,
            from_user_id=ticket.assigned_to_id,
            to_user_id=to_user_id,
            transferred_by=user.id,
            reason=reason,
        )
    )
    ticket.assigned_to_id = to_user_id
    db.add(
        TicketActivity(
            ticket_id=ticket.id,
            user_id=user.id,
            action="transferred",
            detail=f"Devredildi: {_display_name(to_user)}.",
        )
    )
    db.commit()
    db.refresh(ticket)
    return ticket


def add_comment(db: Session, ticket: Ticket, comment: str, user: User) -> TicketActivity:
    activity = TicketActivity(
        ticket_id=ticket.id,
        user_id=user.id,
        action="comment",
        detail=comment,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def ticket_out(ticket: Ticket) -> TicketOut:
    return TicketOut(
        id=ticket.id,
        ticket_no=ticket.ticket_no,
        customer_id=ticket.customer_id,
        customer_name=ticket.customer.company_name if ticket.customer else None,
        subject=ticket.subject,
        description=ticket.description,
        priority=ticket.priority,
        status_id=ticket.status_id,
        status_code=ticket.status.code if ticket.status else None,
        status_name=ticket.status.name if ticket.status else None,
        status_color=ticket.status.color if ticket.status else None,
        assigned_to_id=ticket.assigned_to_id,
        assigned_to_name=_display_name(ticket.assignee),
        created_by=ticket.created_by,
        created_by_name=_display_name(ticket.creator),
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        due_at=ticket.due_at,
        closed_at=ticket.closed_at,
    )


def build_detail(db: Session, ticket: Ticket) -> TicketDetailOut:
    activities = db.scalars(
        select(TicketActivity)
        .where(TicketActivity.ticket_id == ticket.id)
        .order_by(TicketActivity.created_at.desc())
    ).all()
    transfers = db.scalars(
        select(TicketTransfer)
        .where(TicketTransfer.ticket_id == ticket.id)
        .order_by(TicketTransfer.transferred_at.desc())
    ).all()
    status_history = db.scalars(
        select(TicketStatusHistory)
        .where(TicketStatusHistory.ticket_id == ticket.id)
        .order_by(TicketStatusHistory.created_at.desc())
    ).all()

    user_ids: set[int] = set()
    for activity in activities:
        user_ids.add(activity.user_id)
    for transfer in transfers:
        user_ids.add(transfer.transferred_by)
        if transfer.from_user_id:
            user_ids.add(transfer.from_user_id)
        user_ids.add(transfer.to_user_id)
    for entry in status_history:
        user_ids.add(entry.changed_by)
    names = _names(db, user_ids)

    state_ids = {entry.from_status_id for entry in status_history if entry.from_status_id}
    state_ids |= {entry.to_status_id for entry in status_history}
    if state_ids:
        states = db.scalars(
            select(WorkflowState).where(WorkflowState.id.in_(state_ids))
        ).all()
        state_names = {s.id: s.name for s in states}
    else:
        state_names = {}

    return TicketDetailOut(
        ticket=ticket_out(ticket),
        activities=[
            TicketActivityOut(
                id=a.id,
                user_name=names.get(a.user_id),
                action=a.action,
                detail=a.detail,
                created_at=a.created_at,
            )
            for a in activities
        ],
        transfers=[
            TicketTransferOut(
                id=t.id,
                from_user_name=names.get(t.from_user_id),
                to_user_name=names.get(t.to_user_id),
                reason=t.reason,
                transferred_by_name=names.get(t.transferred_by),
                transferred_at=t.transferred_at,
            )
            for t in transfers
        ],
        status_history=[
            TicketStatusHistoryOut(
                id=h.id,
                from_status_name=state_names.get(h.from_status_id),
                to_status_name=state_names.get(h.to_status_id),
                comment=h.comment,
                changed_by_name=names.get(h.changed_by),
                created_at=h.created_at,
            )
            for h in status_history
        ],
    )
