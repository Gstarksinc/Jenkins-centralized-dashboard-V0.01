import uuid
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AlertResponse(BaseModel):
    id: uuid.UUID
    server_id: uuid.UUID
    server_name: Optional[str] = None
    alert_type: str
    severity: str
    title: str
    description: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    status: str
    first_detected_at: datetime
    last_observed_at: datetime
    resolved_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
