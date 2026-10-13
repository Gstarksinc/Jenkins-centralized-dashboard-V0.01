import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class JobResponse(BaseModel):
    id: uuid.UUID
    server_id: uuid.UUID
    server_name: Optional[str] = None
    name: str
    full_path: str
    job_type: Optional[str] = None
    is_buildable: bool = True
    last_build_number: Optional[int] = None
    last_build_result: Optional[str] = None
    last_build_timestamp: Optional[datetime] = None
    last_successful_build_number: Optional[int] = None
    last_failed_build_number: Optional[int] = None
    health_score: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
