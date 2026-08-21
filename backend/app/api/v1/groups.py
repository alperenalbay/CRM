from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_permissions
from app.models.permission import PermissionGroup
from app.models.user import User
from app.schemas.permission import PermissionGroupCreate, PermissionGroupOut, PermissionGroupUpdate
from app.services import permission as permission_service

router = APIRouter(prefix="/groups", tags=["groups"])


def _get_group_or_404(db: Session, group_id: int) -> PermissionGroup:
    group = db.get(PermissionGroup, group_id)
    if group is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Yetki grubu bulunamadı.",
        )
    return group


@router.get("", response_model=list[PermissionGroupOut])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("groups.view", "users.view")),
) -> list[PermissionGroup]:
    return list(
        db.scalars(select(PermissionGroup).order_by(PermissionGroup.name)).all()
    )


@router.get("/{group_id}", response_model=PermissionGroupOut)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("groups.view", "users.view")),
) -> PermissionGroup:
    return _get_group_or_404(db, group_id)


@router.post(
    "", response_model=PermissionGroupOut, status_code=status.HTTP_201_CREATED
)
def create_group(
    payload: PermissionGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("groups.manage")),
) -> PermissionGroup:
    try:
        group = permission_service.create_group(db, payload)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu kod ile yetki grubu zaten mevcut.",
        )
    return group


@router.patch("/{group_id}", response_model=PermissionGroupOut)
def update_group(
    group_id: int,
    payload: PermissionGroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("groups.manage")),
) -> PermissionGroup:
    group = _get_group_or_404(db, group_id)
    group = permission_service.update_group(db, group, payload)
    return group
