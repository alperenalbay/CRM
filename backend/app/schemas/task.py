from datetime import datetime

from pydantic import BaseModel


class TaskBase(BaseModel):
    title: str
    description: str | None = None
    priority: str = "medium"
    assigned_to_id: int | None = None
    related_ticket_id: int | None = None
    due_at: datetime | None = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    due_at: datetime | None = None


class TaskStatusIn(BaseModel):
    status_code: str


class TaskAssignIn(BaseModel):
    to_user_id: int
    reason: str | None = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: str | None = None
    priority: str
    status_id: int
    status_code: str | None = None
    status_name: str | None = None
    status_color: str | None = None
    assigned_to_id: int | None = None
    assigned_to_name: str | None = None
    assigned_by_name: str | None = None
    related_ticket_id: int | None = None
    due_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class TaskAssignmentOut(BaseModel):
    id: int
    user_name: str | None = None
    assigned_by_name: str | None = None
    assigned_at: datetime


class TaskDetailOut(BaseModel):
    task: TaskOut
    assignments: list[TaskAssignmentOut] = []
