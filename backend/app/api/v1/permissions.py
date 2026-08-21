from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_permissions
from app.models.permission import Permission
from app.models.user import User
from app.schemas.permission import PermissionOut

router = APIRouter(prefix="/permissions", tags=["permissions"])


@router.get("", response_model=list[PermissionOut])
def list_permissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("groups.view", "users.view")),
) -> list[Permission]:
    return list(
        db.scalars(select(Permission).order_by(Permission.module, Permission.code))
    )
