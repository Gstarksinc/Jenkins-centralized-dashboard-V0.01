from typing import List, Optional
from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_controllers: int = 0
    online_controllers: int = 0
    offline_controllers: int = 0
    total_jobs: int = 0
    total_nodes: int = 0
    online_nodes: int = 0
    active_builds: int = 0
    active_alerts: int = 0
    queue_depth: int = 0


class BuildTrendItem(BaseModel):
    date: str
    success: int = 0
    failure: int = 0
    unstable: int = 0
    aborted: int = 0
