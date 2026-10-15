from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=1)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class UserProfileResponse(BaseModel):
    id: UUID
    email: str
    display_name: str
    status: str
    is_bootstrap_admin: bool
    roles: List[str] = []
    permissions: List[str] = []
    session_token: Optional[str] = None


class AuditEventResponse(BaseModel):
    id: int
    correlation_id: UUID
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    status: str
    ip_address: Optional[str] = None
    timestamp: str
    actor_email: Optional[str] = None
