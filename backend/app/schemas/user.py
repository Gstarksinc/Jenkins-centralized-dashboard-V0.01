from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class RoleSimpleResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    is_system: bool

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    email: EmailStr
    display_name: str = Field(min_length=2, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    role_id: Optional[UUID] = None
    role_name: Optional[str] = None


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    status: Optional[str] = None  # ACTIVE, INACTIVE, SUSPENDED
    role_ids: Optional[List[UUID]] = None


class UserResponse(BaseModel):
    id: UUID
    email: str
    display_name: str
    status: str
    is_bootstrap_admin: bool
    roles: List[RoleSimpleResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
