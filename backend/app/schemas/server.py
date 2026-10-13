from typing import List, Optional, Any
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, HttpUrl, Field


class JenkinsServerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    base_url: str = Field(min_length=8, max_length=500)
    environment: str = Field(default="production")
    description: Optional[str] = None
    auth_type: str = Field(default="TOKEN")  # TOKEN or BASIC
    username: str = Field(min_length=1, max_length=255)
    secret_token: str = Field(min_length=1, max_length=500)  # Write-only
    collection_interval_seconds: int = Field(default=60, ge=15, le=3600)
    connection_timeout_seconds: int = Field(default=15, ge=5, le=120)
    tags: List[str] = Field(default_factory=list)


class JenkinsServerUpdate(BaseModel):
    name: Optional[str] = None
    environment: Optional[str] = None
    description: Optional[str] = None
    is_enabled: Optional[bool] = None
    collection_interval_seconds: Optional[int] = None
    connection_timeout_seconds: Optional[int] = None
    username: Optional[str] = None
    secret_token: Optional[str] = None  # Write-only, optional rotation
    tags: Optional[List[str]] = None


class JenkinsServerResponse(BaseModel):
    id: UUID
    name: str
    base_url: str
    environment: str
    description: Optional[str] = None
    status: str
    is_enabled: bool
    collection_interval_seconds: int
    connection_timeout_seconds: int
    version_info: Optional[str] = None
    last_successful_sync: Optional[datetime] = None
    last_error_message: Optional[str] = None
    tags: List[Any] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConnectionTestRequest(BaseModel):
    base_url: str
    username: str
    secret_token: str
    auth_type: str = "TOKEN"
    connection_timeout_seconds: int = 15


class ConnectionTestResponse(BaseModel):
    online: bool
    status: str
    version: Optional[str] = None
    message: str
    description: Optional[str] = None
