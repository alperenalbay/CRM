from sqlalchemy import Column, ForeignKey, String, Table
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import SoftDeleteMixin, TimestampMixin

permission_group_permissions = Table(
    "permission_group_permissions",
    Base.metadata,
    Column("group_id", ForeignKey("permission_groups.id"), primary_key=True),
    Column("permission_id", ForeignKey("permissions.id"), primary_key=True),
)

user_permission_groups = Table(
    "user_permission_groups",
    Base.metadata,
    Column("user_id", ForeignKey("users.id"), primary_key=True),
    Column("group_id", ForeignKey("permission_groups.id"), primary_key=True),
)


class Permission(Base, TimestampMixin):
    __tablename__ = "permissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    module: Mapped[str] = mapped_column(String(50), nullable=False)

    groups: Mapped[list["PermissionGroup"]] = relationship(
        secondary=permission_group_permissions,
        back_populates="permissions",
    )


class PermissionGroup(Base, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "permission_groups"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500))

    permissions: Mapped[list[Permission]] = relationship(
        secondary=permission_group_permissions,
        back_populates="groups",
    )
    users: Mapped[list["User"]] = relationship(
        secondary=user_permission_groups,
        back_populates="groups",
    )
