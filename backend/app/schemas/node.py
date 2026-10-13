import uuid
from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NodeResponse(BaseModel):
    id: uuid.UUID
    server_id: uuid.UUID
    server_name: Optional[str] = None
    name: str
    is_online: bool
    offline_cause: Optional[str] = None
    num_executors: int
    busy_executors: int
    idle_executors: int
    labels: List[Any] = []
    last_seen_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
