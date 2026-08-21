from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_permissions
from app.models.user import Role, User
from app.schemas.ticket import UserBriefOut
from app.schemas.user import (
    AvailabilityUpdate,
    RoleOut,
    TodayActivityOut,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.services import me as me_service
from app.services import permission as permission_service

router = APIRouter(prefix="/users", tags=["users"])


def _get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı.",
        )
    return user


@router.patch("/me/status", response_model=UserOut)
def update_my_availability(
    payload: AvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserOut:
    user = me_service.set_availability(db, current_user, payload.availability)
    return permission_service.build_user_out(user)


@router.get("/me/activity", response_model=TodayActivityOut)
def my_today_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TodayActivityOut:
    return me_service.today_activity(db, current_user)


@router.get("/roles", response_model=list[RoleOut])
def list_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Role]:
    return list(db.scalars(select(Role).order_by(Role.id)))


@router.get("/agents", response_model=list[UserBriefOut])
def list_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[UserBriefOut]:
    stmt = (
        select(User)
        .join(Role, User.role_id == Role.id)
        .where(
            User.is_active == True,
            Role.code.in_(["admin", "support", "sales"]),
        )
        .order_by(User.full_name)
    )
    users = db.scalars(stmt).all()
    return [
        UserBriefOut(
            id=u.id,
            username=u.username,
            full_name=u.full_name,
            role_code=u.role.code if u.role else None,
            availability=u.availability,
        )
        for u in users
    ]


@router.get("", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("users.view")),
) -> list[UserOut]:
    users = db.scalars(select(User).order_by(User.id)).all()
    return [permission_service.build_user_out(u) for u in users]


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("users.create")),
) -> UserOut:
    try:
        user = permission_service.create_user(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı adı veya e-posta zaten kullanımda.",
        )
    return permission_service.build_user_out(user)


@router.patch("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions("users.update")),
) -> UserOut:
    user = _get_user_or_404(db, user_id)
    if user_id == current_user.id and payload.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kendi hesabınızı pasifleştiremezsiniz.",
        )
    try:
        user = permission_service.update_user(db, user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kullanıcı adı veya e-posta zaten kullanımda.",
        )
    return permission_service.build_user_out(user)
