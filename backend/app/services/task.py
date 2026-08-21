from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task, TaskActivity, TaskAssignment
from app.models.user import User
from app.models.workflow import WorkflowState
from app.schemas.task import (
    TaskAssignmentOut,
    TaskCreate,
    TaskDetailOut,
    TaskOut,
)


def _display_name(user: User | None) -> str | None:
    if user is None:
        return None
    return user.full_name or user.username


def default_task_state(db: Session) -> WorkflowState:
    state = db.scalar(
        select(WorkflowState).where(
            WorkflowState.category == "task", WorkflowState.is_default == True
        )
    )
    if state is None:
        state = db.scalar(
            select(WorkflowState)
            .where(WorkflowState.category == "task")
            .order_by(WorkflowState.sort_order)
        )
    if state is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Görev durumu tanımlı değil.",
        )
    return state


def get_task_state_by_code(db: Session, code: str) -> WorkflowState:
    state = db.scalar(
        select(WorkflowState)
        .where(WorkflowState.code == code, WorkflowState.is_active == True)
    )
    if state is None or state.category != "task":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Geçersiz görev durumu."
        )
    return state


def create_task(db: Session, payload: TaskCreate, user: User) -> Task:
    state = default_task_state(db)
    task = Task(
        title=payload.title,
        description=payload.description,
        priority=payload.priority or "medium",
        status_id=state.id,
        assigned_to_id=payload.assigned_to_id,
        assigned_by=user.id,
        related_ticket_id=payload.related_ticket_id,
        due_at=payload.due_at,
    )
    db.add(task)
    db.flush()
    db.add(
        TaskActivity(
            task_id=task.id,
            user_id=user.id,
            action="created",
            detail=f"Görev oluşturuldu ({state.name}).",
        )
    )
    if payload.assigned_to_id:
        db.add(
            TaskAssignment(
                task_id=task.id,
                user_id=payload.assigned_to_id,
                assigned_by=user.id,
            )
        )
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, task: Task, payload, user: User) -> Task:
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(task, field, value)
    if "description" in data and data["description"]:
        db.add(
            TaskActivity(
                task_id=task.id,
                user_id=user.id,
                action="detail",
                detail=data["description"],
            )
        )
    db.commit()
    db.refresh(task)
    return task


def change_status(db: Session, task: Task, status_code: str, user: User) -> Task:
    to_state = get_task_state_by_code(db, status_code)
    if task.status_id == to_state.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Görev zaten bu durumda."
        )
    from_name = task.status.name if task.status else None
    task.status_id = to_state.id
    db.add(
        TaskActivity(
            task_id=task.id,
            user_id=user.id,
            action="status_changed",
            detail=f"{from_name} → {to_state.name}",
        )
    )
    db.commit()
    db.refresh(task)
    return task


def assign(db: Session, task: Task, to_user_id: int, user: User) -> Task:
    to_user = db.get(User, to_user_id)
    if to_user is None or not to_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Hedef kullanıcı bulunamadı."
        )
    if task.assigned_to_id != to_user_id:
        db.add(TaskAssignment(task_id=task.id, user_id=to_user_id, assigned_by=user.id))
    task.assigned_to_id = to_user_id
    task.assigned_by = user.id
    db.commit()
    db.refresh(task)
    return task


def task_out(task: Task) -> TaskOut:
    return TaskOut(
        id=task.id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status_id=task.status_id,
        status_code=task.status.code if task.status else None,
        status_name=task.status.name if task.status else None,
        status_color=task.status.color if task.status else None,
        assigned_to_id=task.assigned_to_id,
        assigned_to_name=_display_name(task.assignee),
        assigned_by_name=_display_name(task.assigner),
        related_ticket_id=task.related_ticket_id,
        due_at=task.due_at,
        created_at=task.created_at,
        updated_at=task.updated_at,
    )


def build_detail(db: Session, task: Task) -> TaskDetailOut:
    assignments = db.scalars(
        select(TaskAssignment)
        .where(TaskAssignment.task_id == task.id)
        .order_by(TaskAssignment.assigned_at.desc())
    ).all()
    user_ids = {a.user_id for a in assignments} | {a.assigned_by for a in assignments}
    users = {}
    if user_ids:
        found = db.scalars(select(User).where(User.id.in_(user_ids))).all()
        users = {u.id: _display_name(u) for u in found}
    return TaskDetailOut(
        task=task_out(task),
        assignments=[
            TaskAssignmentOut(
                id=a.id,
                user_name=users.get(a.user_id),
                assigned_by_name=users.get(a.assigned_by),
                assigned_at=a.assigned_at,
            )
            for a in assignments
        ],
    )
