from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_db, require_permissions
from app.models.task import Task
from app.models.user import User
from app.schemas.task import (
    TaskAssignIn,
    TaskCreate,
    TaskDetailOut,
    TaskOut,
    TaskStatusIn,
    TaskUpdate,
)
from app.services import task as task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])

TASK_OPTIONS = (
    selectinload(Task.status),
    selectinload(Task.assignee),
    selectinload(Task.assigner),
    selectinload(Task.ticket),
)


def _get_task_or_404(db: Session, task_id: int) -> Task:
    task = db.scalar(
        select(Task)
        .options(*TASK_OPTIONS)
        .where(Task.id == task_id, Task.is_active == True)
    )
    if task is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Görev bulunamadı."
        )
    return task


@router.get("", response_model=list[TaskOut])
def list_tasks(
    status_code: str | None = None,
    priority: str | None = None,
    assigned_to: int | None = None,
    q: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tasks.view")),
) -> list[TaskOut]:
    stmt = select(Task).options(*TASK_OPTIONS).where(Task.is_active == True)
    if status_code:
        stmt = stmt.where(Task.status.has(code=status_code))
    if priority:
        stmt = stmt.where(Task.priority == priority)
    if assigned_to:
        stmt = stmt.where(Task.assigned_to_id == assigned_to)
    if q:
        stmt = stmt.where(Task.title.ilike(f"%{q}%"))
    stmt = stmt.order_by(Task.id.desc()).offset(skip).limit(limit)
    tasks = db.scalars(stmt).all()
    return [task_service.task_out(t) for t in tasks]


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tasks.create")),
) -> TaskOut:
    task = task_service.create_task(db, payload, current_user)
    return task_service.task_out(task)


@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tasks.view")),
) -> TaskOut:
    return task_service.task_out(_get_task_or_404(db, task_id))


@router.get("/{task_id}/detail", response_model=TaskDetailOut)
def get_task_detail(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tasks.view")),
) -> TaskDetailOut:
    return task_service.build_detail(db, _get_task_or_404(db, task_id))


@router.patch("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tasks.update")),
) -> TaskOut:
    task = _get_task_or_404(db, task_id)
    return task_service.task_out(
        task_service.update_task(db, task, payload, current_user)
    )


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tasks.delete")),
) -> None:
    task = _get_task_or_404(db, task_id)
    task.is_active = False
    db.commit()


@router.post("/{task_id}/status", response_model=TaskOut)
def change_task_status(
    task_id: int,
    payload: TaskStatusIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tasks.change_status")),
) -> TaskOut:
    task = _get_task_or_404(db, task_id)
    updated = task_service.change_status(db, task, payload.status_code, current_user)
    return task_service.task_out(updated)


@router.post("/{task_id}/assign", response_model=TaskOut)
def assign_task(
    task_id: int,
    payload: TaskAssignIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("tasks.assign")),
) -> TaskOut:
    task = _get_task_or_404(db, task_id)
    updated = task_service.assign(db, task, payload.to_user_id, current_user)
    return task_service.task_out(updated)
