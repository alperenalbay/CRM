from datetime import datetime, time as dt_time

from fastapi import HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.orm import Session, selectinload

from app.core.security import hash_password, verify_password
from app.models.task import Task, TaskActivity
from app.models.ticket import Ticket, TicketActivity
from app.models.user import User
from app.models.workflow import WorkflowState
from app.schemas.user import TodayActivityItem, TodayActivityOut

AVAILABILITY_VALUES = {"uygun", "yemekte", "disarda", "molada"}


def set_availability(db: Session, user: User, availability: str) -> User:
    if availability not in AVAILABILITY_VALUES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz durum."
        )
    user.availability = availability
    db.commit()
    db.refresh(user)
    return user


def change_password(db: Session, user: User, current_password: str, new_password: str) -> None:
    if not verify_password(current_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Mevcut şifre hatalı."
        )
    user.hashed_password = hash_password(new_password)
    db.commit()


def _start_of_today() -> datetime:
    now = datetime.now()
    return datetime.combine(now.date(), dt_time.min)


def today_activity(db: Session, user: User) -> TodayActivityOut:
    start = _start_of_today()

    ticket_activities = db.scalars(
        select(TicketActivity)
        .join(Ticket, TicketActivity.ticket_id == Ticket.id)
        .join(WorkflowState, Ticket.status_id == WorkflowState.id)
        .options(selectinload(TicketActivity.ticket).selectinload(Ticket.customer))
        .where(
            TicketActivity.user_id == user.id,
            TicketActivity.action == "comment",
            TicketActivity.created_at >= start,
            Ticket.is_active == True,
            WorkflowState.code != "ticket_closed",
        )
    ).all()

    task_activities = db.scalars(
        select(TaskActivity)
        .join(Task, TaskActivity.task_id == Task.id)
        .join(WorkflowState, Task.status_id == WorkflowState.id)
        .where(
            TaskActivity.user_id == user.id,
            TaskActivity.action == "detail",
            TaskActivity.created_at >= start,
            Task.is_active == True,
            WorkflowState.code != "task_done",
        )
    ).all()

    items: list[TodayActivityItem] = []
    for activity in ticket_activities:
        ticket = activity.ticket
        items.append(
            TodayActivityItem(
                kind="ticket",
                id=ticket.id,
                ref=ticket.ticket_no,
                title=ticket.subject,
                action=activity.action,
                detail=activity.detail,
                customer_name=ticket.customer.company_name if ticket.customer else None,
                created_at=activity.created_at,
            )
        )
    for activity in task_activities:
        task = activity.task
        items.append(
            TodayActivityItem(
                kind="task",
                id=task.id,
                ref=None,
                title=task.title,
                action=activity.action,
                detail=activity.detail,
                created_at=activity.created_at,
            )
        )
    items.sort(key=lambda item: item.created_at, reverse=True)

    return TodayActivityOut(
        username=user.username,
        full_name=user.full_name,
        availability=user.availability,
        items=items,
    )
