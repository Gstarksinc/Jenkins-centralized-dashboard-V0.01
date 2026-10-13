import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class BuildResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    server_id: uuid.UUID
    job_name: Optional[str] = None
    server_name: Optional[str] = None
    build_number: int
    normalized_status: str
    jenkins_result: Optional[str] = None
    start_time: Optional[datetime] = None
    completion_time: Optional[datetime] = None
    duration_ms: Optional[int] = None
    triggered_by: Optional[str] = None
    vcs_branch: Optional[str] = None
    vcs_commit: Optional[str] = None
    build_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConsoleLogResponse(BaseModel):
    build_id: uuid.UUID
    job_name: str
    build_number: int
    log_content: str
