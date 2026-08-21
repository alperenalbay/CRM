from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    full_name: str | None = None
    email: str | None = Field(default=None, max_length=255)
    password: str = Field(min_length=6, max_length=128)
    role_code: str
    group_ids: list[int] = Field(default_factory=list)


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    password: str | None = Field(default=None, min_length=6, max_length=128)
    role_code: str | None = None
    group_ids: list[int] | None = None
    is_active: bool | None = None


class UserOut(BaseModel):
    id: int
    username: str
    full_name: str | None = None
    email: str | None = None
    role: str | None = None
    is_active: bool = True
    permissions: list[str] = Field(default_factory=list)
    groups: list[str] = Field(default_factory=list)
    availability: str = "uygun"


AvailabilityValue = Literal["uygun", "yemekte", "disarda", "molada"]


class AvailabilityUpdate(BaseModel):
    availability: AvailabilityValue


class TodayActivityItem(BaseModel):
    kind: str
    id: int
    ref: str | None = None
    title: str
    action: str
    detail: str | None = None
    customer_name: str | None = None
    created_at: datetime


class TodayActivityOut(BaseModel):
    username: str
    full_name: str | None = None
    availability: str
    items: list[TodayActivityItem] = Field(default_factory=list)
