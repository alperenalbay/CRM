from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.permission import Permission, PermissionGroup
from app.models.user import Role, User
from app.schemas.permission import PermissionGroupCreate, PermissionGroupUpdate
from app.schemas.user import UserCreate, UserOut, UserUpdate

ROLE_FALLBACK_PERMISSIONS: dict[str, set[str]] = {
    "support": {
        "dashboard.view",
        "customers.view",
        "customers.create",
        "customers.update",
        "tickets.view",
        "tickets.create",
        "tickets.update",
        "tickets.change_status",
        "tickets.transfer",
        "tasks.view",
        "tasks.create",
        "tasks.update",
        "tasks.change_status",
        "tasks.assign",
        "users.view",
        "imports.preview",
    },
    "sales": {
        "dashboard.view",
        "customers.view",
        "customers.create",
        "customers.update",
        "tickets.view",
        "tickets.create",
        "tickets.update",
        "sales.view",
        "sales.create",
        "sales.update",
        "products.view",
        "products.create",
        "imports.preview",
    },
}


def effective_permission_codes(user: User) -> set[str]:
    codes = {p.code for g in user.groups if g.is_active for p in g.permissions}
    if codes:
        return codes
    if user.role and user.role.code in ROLE_FALLBACK_PERMISSIONS:
        return set(ROLE_FALLBACK_PERMISSIONS[user.role.code])
    return set()


def build_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        email=user.email,
        role=user.role.code if user.role else None,
        is_active=user.is_active,
        permissions=sorted(effective_permission_codes(user)),
        groups=sorted(g.name for g in user.groups if g.is_active),
        availability=user.availability,
    )


def _get_role(db: Session, role_code: str) -> Role:
    role = db.scalar(select(Role).where(Role.code == role_code))
    if role is None:
        raise ValueError(f"Rol bulunamadı: {role_code}")
    return role


def create_user(db: Session, payload: UserCreate) -> User:
    role = _get_role(db, payload.role_code)
    user = User(
        username=payload.username,
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role_id=role.id,
    )
    if payload.group_ids:
        groups = list(
            db.scalars(
                select(PermissionGroup).where(
                    PermissionGroup.id.in_(payload.group_ids),
                    PermissionGroup.is_active == True,
                )
            )
        )
        user.groups = groups
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: User, payload: UserUpdate) -> User:
    data = payload.model_dump(exclude_unset=True)
    if "role_code" in data and data["role_code"] is not None:
        user.role_id = _get_role(db, data["role_code"]).id
    if "password" in data and data["password"]:
        user.hashed_password = hash_password(data["password"])
    if "group_ids" in data and data["group_ids"] is not None:
        groups = list(
            db.scalars(
                select(PermissionGroup).where(
                    PermissionGroup.id.in_(data["group_ids"]),
                    PermissionGroup.is_active == True,
                )
            )
        )
        user.groups = groups
    for field in ("full_name", "email", "is_active"):
        if field in data:
            setattr(user, field, data[field])
    db.commit()
    db.refresh(user)
    return user


def set_group_permissions(db: Session, group: PermissionGroup, codes: list[str]) -> None:
    if codes:
        permissions = list(
            db.scalars(select(Permission).where(Permission.code.in_(codes)))
        )
        group.permissions = permissions
    else:
        group.permissions = []


def set_group_users(db: Session, group: PermissionGroup, user_ids: list[int]) -> None:
    if user_ids:
        users = list(db.scalars(select(User).where(User.id.in_(user_ids))))
        group.users = users
    else:
        group.users = []


def create_group(db: Session, payload: PermissionGroupCreate) -> PermissionGroup:
    group = PermissionGroup(
        code=payload.code,
        name=payload.name,
        description=payload.description,
    )
    db.add(group)
    db.flush()
    set_group_permissions(db, group, payload.permission_codes)
    set_group_users(db, group, payload.user_ids)
    db.commit()
    db.refresh(group)
    return group


def update_group(
    db: Session, group: PermissionGroup, payload: PermissionGroupUpdate
) -> PermissionGroup:
    data = payload.model_dump(exclude_unset=True)
    for field in ("name", "description", "is_active"):
        if field in data:
            setattr(group, field, data[field])
    if "permission_codes" in data:
        set_group_permissions(db, group, data["permission_codes"])
    if "user_ids" in data:
        set_group_users(db, group, data["user_ids"])
    db.commit()
    db.refresh(group)
    return group
