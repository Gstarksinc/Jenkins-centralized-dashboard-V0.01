from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.session import get_db
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate, UserUpdate, UserResponse, RoleSimpleResponse
from app.core.security import hash_password

router = APIRouter(tags=["Users"])

DEFAULT_ROLES = [
    ("Platform Administrator", "Full control over all dashboard users, controllers, and platform settings.", True),
    ("Server Administrator", "Manage assigned Jenkins controllers and view server-level metrics.", True),
    ("Developer", "View permitted controllers, jobs, and trigger authorized builds.", True),
    ("Viewer", "Read-only access to assigned servers, jobs, and dashboard information.", True),
]


def ensure_default_roles(db: Session):
    """Idempotently seed default system roles if they don't exist."""
    for role_name, description, is_system in DEFAULT_ROLES:
        existing = db.execute(select(Role).where(Role.name == role_name)).scalar_one_or_none()
        if not existing:
            new_role = Role(name=role_name, description=description, is_system=is_system)
            db.add(new_role)
    db.commit()


@router.get("/roles", response_model=List[RoleSimpleResponse])
def list_roles(db: Session = Depends(get_db)):
    """List all available system roles."""
    ensure_default_roles(db)
    roles = db.execute(select(Role).order_by(Role.name)).scalars().all()
    return roles


@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """List all registered dashboard users."""
    ensure_default_roles(db)
    users = db.execute(select(User).order_by(User.created_at.desc())).scalars().all()
    return users


@router.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    """Create a new dashboard user with hashed password and assigned role."""
    ensure_default_roles(db)

    # Check if user with same email exists
    existing = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A user with email '{payload.email}' already exists.",
        )

    # Resolve role
    role = None
    if payload.role_id:
        role = db.execute(select(Role).where(Role.id == payload.role_id)).scalar_one_or_none()
    elif payload.role_name:
        role = db.execute(select(Role).where(Role.name == payload.role_name)).scalar_one_or_none()

    if not role:
        # Default to Developer if not specified
        role = db.execute(select(Role).where(Role.name == "Developer")).scalar_one_or_none()

    hashed_pw = hash_password(payload.password)
    user = User(
        email=payload.email,
        display_name=payload.display_name,
        password_hash=hashed_pw,
        status="ACTIVE",
    )
    if role:
        user.roles.append(role)

    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: UUID, payload: UserUpdate, db: Session = Depends(get_db)):
    """Update user status or assigned roles."""
    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    if payload.display_name is not None:
        user.display_name = payload.display_name

    if payload.status is not None:
        user.status = payload.status

    if payload.role_ids is not None:
        roles = db.execute(select(Role).where(Role.id.in_(payload.role_ids))).scalars().all()
        user.roles = roles

    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(user_id: UUID, db: Session = Depends(get_db)):
    """Deactivate a user account."""
    user = db.execute(select(User).where(User.id == user_id)).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    user.status = "INACTIVE"
    db.commit()
    db.refresh(user)
    return user
