from pydantic import BaseModel, ConfigDict, Field


class PermissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    code: str
    name: str
    module: str


class PermissionGroupCreate(BaseModel):
    code: str = Field(min_length=2, max_length=100)
    name: str = Field(min_length=2, max_length=150)
    description: str | None = None
    permission_codes: list[str] = Field(default_factory=list)
    user_ids: list[int] = Field(default_factory=list)


class PermissionGroupUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None
    permission_codes: list[str] | None = None
    user_ids: list[int] | None = None


class PermissionGroupOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    description: str | None = None
    is_active: bool = True
    permissions: list[PermissionOut] = Field(default_factory=list)
    user_ids: list[int] = Field(default_factory=list)
