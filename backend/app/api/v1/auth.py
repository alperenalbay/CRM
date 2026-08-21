import time
from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import ChangePasswordRequest, LoginRequest, RefreshRequest, Token
from app.schemas.user import UserOut
from app.services import me as me_service
from app.services.permission import build_user_out

router = APIRouter(prefix="/auth", tags=["auth"])

LOGIN_MAX_ATTEMPTS = 5
LOGIN_WINDOW_SECONDS = 300
LOGIN_ATTEMPTS: dict[str, list[float]] = defaultdict(list)


def _login_limit_key(username: str, request: Request) -> str:
    ip = request.client.host if request.client else "unknown"
    return f"{username}:{ip}"


def _check_login_limit(key: str) -> None:
    now = time.monotonic()
    recent = [t for t in LOGIN_ATTEMPTS[key] if now - t < LOGIN_WINDOW_SECONDS]
    LOGIN_ATTEMPTS[key] = recent
    if len(recent) >= LOGIN_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Çok fazla hatalı deneme. 5 dakika sonra tekrar deneyin.",
        )


def _record_login_failure(key: str) -> None:
    LOGIN_ATTEMPTS[key].append(time.monotonic())


def _user_to_out(user: User) -> UserOut:
    return build_user_out(user)


def _issue_tokens(user_id: int) -> Token:
    return Token(
        access_token=create_access_token(str(user_id)),
        refresh_token=create_refresh_token(str(user_id)),
    )


@router.post("/login", response_model=Token)
def login(
    payload: LoginRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> Token:
    limit_key = _login_limit_key(payload.username, request)
    _check_login_limit(limit_key)
    user = db.scalar(select(User).where(User.username == payload.username))
    if user is None or not verify_password(payload.password, user.hashed_password):
        _record_login_failure(limit_key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı adı veya şifre hatalı.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesap pasif durumda.",
        )
    return _issue_tokens(user.id)


@router.post("/refresh", response_model=Token)
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)) -> Token:
    try:
        token_payload = decode_token(payload.refresh_token)
        if token_payload.get("type") != "refresh":
            raise ValueError
        user_id = int(token_payload.get("sub", 0))
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz yenileme token'ı.",
        )
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı.",
        )
    return _issue_tokens(user.id)


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)) -> UserOut:
    return _user_to_out(current_user)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    me_service.change_password(
        db, current_user, payload.current_password, payload.new_password
    )
