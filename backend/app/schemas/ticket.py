from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TicketBase(BaseModel):
    customer_id: int
    subject: str
    description: str | None = None
    priority: str = "medium"
    assigned_to_id: int | None = None
    due_at: datetime | None = None


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    subject: str | None = None
    description: str | None = None
    priority: str | None = None
    assigned_to_id: int | None = None
    due_at: datetime | None = None


class TicketStatusIn(BaseModel):
    status_code: str
    comment: str | None = None


class TicketTransferIn(BaseModel):
    to_user_id: int
    reason: str | None = None


class TicketCommentIn(BaseModel):
    comment: str


class TicketOut(BaseModel):
    id: int
    ticket_no: str
    customer_id: int
    customer_name: str | None = None
    subject: str
    description: str | None = None
    priority: str
    status_id: int
    status_code: str | None = None
    status_name: str | None = None
    status_color: str | None = None
    assigned_to_id: int | None = None
    assigned_to_name: str | None = None
    created_by: int
    created_by_name: str | None = None
    created_at: datetime
    updated_at: datetime
    due_at: datetime | None = None
    closed_at: datetime | None = None


class TicketStatusHistoryOut(BaseModel):
    id: int
    from_status_name: str | None = None
    to_status_name: str | None = None
    comment: str | None = None
    changed_by_name: str | None = None
    created_at: datetime


class TicketTransferOut(BaseModel):
    id: int
    from_user_name: str | None = None
    to_user_name: str | None = None
    reason: str | None = None
    transferred_by_name: str | None = None
    transferred_at: datetime


class TicketActivityOut(BaseModel):
    id: int
    user_name: str | None = None
    action: str
    detail: str | None = None
    created_at: datetime


class TicketDetailOut(BaseModel):
    ticket: TicketOut
    activities: list[TicketActivityOut] = []
    transfers: list[TicketTransferOut] = []
    status_history: list[TicketStatusHistoryOut] = []


class WorkflowStateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    color: str | None = None
    category: str
    sort_order: int
    is_default: bool


class UserBriefOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str | None = None
    role_code: str | None = None
    availability: str = "uygun"
