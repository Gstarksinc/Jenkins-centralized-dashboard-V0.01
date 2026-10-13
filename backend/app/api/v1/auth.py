from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User
from app.models.session import UserSession
from app.models.audit import AuditEvent
from app.schemas.auth import LoginRequest, ChangePasswordRequest, UserProfileResponse, AuditEventResponse
from app.core.security import verify_password, hash_password, generate_session_token
from app.services.audit_service import AuditService
from app.config import settings

router = APIRouter(tags=["Authentication & Audit"])


def get_current_user_optional(request: Request, db: Session = Depends(get_db)) -> Optional[User]:
    """Retrieve currently authenticated user from session cookie or Authorization header."""
    session_id = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not session_id:
        auth_hdr = request.headers.get("Authorization")
        if auth_hdr and auth_hdr.startswith("Bearer "):
            session_id = auth_hdr[7:]

    if not session_id:
        return None

    # Find active session
    user_sess = db.execute(
        select(UserSession).where(
            UserSession.id == session_id,
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > datetime.now(timezone.utc),
        )
    ).scalar_one_or_none()

    if not user_sess:
        return None

    user = db.execute(select(User).where(User.id == user_sess.user_id)).scalar_one_or_none()
    return user


def get_current_user(user: Optional[User] = Depends(get_current_user_optional)) -> User:
    """Dependency that enforces authenticated user presence."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
        )
    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive or suspended.",
        )
    return user


@router.post("/auth/login", response_model=UserProfileResponse)
def login(payload: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    """Authenticate with email and password, creating a secure server-side session."""
    user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()

    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("User-Agent")

    if not user or not verify_password(payload.password, user.password_hash):
        AuditService.log_event(
            db=db,
            action="AUTH_LOGIN_FAILED",
            resource_type="auth",
            resource_id=payload.email,
            status="FAILURE",
            ip_address=ip_address,
            user_agent=user_agent,
            details={"email": payload.email},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.status.lower()}.",
        )

    # Generate session token and store in database
    session_token = generate_session_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.SESSION_EXPIRE_HOURS)

    user_sess = UserSession(
        id=session_token,
        user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent[:255] if user_agent else None,
        expires_at=expires_at,
    )
    db.add(user_sess)
    db.commit()

    # Set secure HttpOnly session cookie
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_token,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        max_age=settings.SESSION_EXPIRE_HOURS * 3600,
        path="/",
    )

    # Set CSRF Token
    csrf_token = generate_session_token()
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,  # Accessible to client to mirror in headers
        secure=settings.SESSION_COOKIE_SECURE,
        samesite="lax",
        path="/",
    )

    AuditService.log_event(
        db=db,
        action="AUTH_LOGIN_SUCCESS",
        resource_type="auth",
        resource_id=str(user.id),
        actor_user_id=user.id,
        status="SUCCESS",
        ip_address=ip_address,
        user_agent=user_agent,
    )

    role_names = [r.name for r in user.roles]
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        status=user.status,
        is_bootstrap_admin=user.is_bootstrap_admin,
        roles=role_names,
    )


@router.post("/auth/logout")
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    """Revoke active session and clear cookies."""
    session_id = request.cookies.get(settings.SESSION_COOKIE_NAME)
    user = get_current_user_optional(request, db)

    if session_id:
        user_sess = db.execute(select(UserSession).where(UserSession.id == session_id)).scalar_one_or_none()
        if user_sess:
            user_sess.revoked_at = datetime.now(timezone.utc)
            db.commit()

    response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/")
    response.delete_cookie(settings.CSRF_COOKIE_NAME, path="/")

    if user:
        AuditService.log_event(
            db=db,
            action="AUTH_LOGOUT",
            resource_type="auth",
            resource_id=str(user.id),
            actor_user_id=user.id,
            status="SUCCESS",
        )

    return {"message": "Logged out successfully."}


@router.get("/auth/me", response_model=UserProfileResponse)
def get_current_user_profile(user: User = Depends(get_current_user)):
    """Retrieve profile and roles for the currently authenticated session."""
    role_names = [r.name for r in user.roles]
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        status=user.status,
        is_bootstrap_admin=user.is_bootstrap_admin,
        roles=role_names,
    )


@router.post("/auth/change-password")
def change_password(payload: ChangePasswordRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Change the active user's password."""
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    user.password_hash = hash_password(payload.new_password)
    db.commit()

    AuditService.log_event(
        db=db,
        action="USER_PASSWORD_CHANGE",
        resource_type="user",
        resource_id=str(user.id),
        actor_user_id=user.id,
        status="SUCCESS",
    )
    return {"message": "Password updated successfully."}


@router.get("/audit-events", response_model=List[AuditEventResponse])
def list_audit_events(limit: int = 50, db: Session = Depends(get_db)):
    """Retrieve latest append-only audit trail events."""
    events = db.execute(
        select(AuditEvent).order_by(AuditEvent.timestamp.desc()).limit(limit)
    ).scalars().all()

    results = []
    for e in events:
        actor_email = e.actor.email if e.actor else "System / Anonymous"
        results.append(
            AuditEventResponse(
                id=e.id,
                correlation_id=e.correlation_id,
                action=e.action,
                resource_type=e.resource_type,
                resource_id=e.resource_id,
                status=e.status,
                ip_address=e.ip_address,
                timestamp=e.timestamp.isoformat(),
                actor_email=actor_email,
            )
        )
    return results
