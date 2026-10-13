from typing import List, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc

from app.db.session import get_db
from app.models.server import JenkinsServer
from app.models.job import Job
from app.models.node import Node
from app.models.build import Build
from app.models.alert import Alert
from app.models.metric import ServerMetric
from app.schemas.dashboard import DashboardSummary, BuildTrendItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Aggregates multi-controller fleet summary statistics."""
    total_controllers = db.execute(select(func.count(JenkinsServer.id))).scalar() or 0
    online_controllers = db.execute(
        select(func.count(JenkinsServer.id)).where(JenkinsServer.status == "ONLINE")
    ).scalar() or 0
    offline_controllers = total_controllers - online_controllers

    total_jobs = db.execute(select(func.count(Job.id))).scalar() or 0
    total_nodes = db.execute(select(func.count(Node.id))).scalar() or 0
    online_nodes = db.execute(
        select(func.count(Node.id)).where(Node.is_online == True)
    ).scalar() or 0

    active_builds = db.execute(
        select(func.count(Build.id)).where(Build.normalized_status == "RUNNING")
    ).scalar() or 0

    active_alerts = db.execute(
        select(func.count(Alert.id)).where(Alert.status == "ACTIVE")
    ).scalar() or 0

    # Queue depth from latest metrics
    latest_metrics = db.execute(
        select(ServerMetric.queue_length)
        .order_by(desc(ServerMetric.recorded_at))
        .limit(10)
    ).scalars().all()
    queue_depth = sum(latest_metrics) if latest_metrics else 0

    return DashboardSummary(
        total_controllers=total_controllers,
        online_controllers=online_controllers,
        offline_controllers=offline_controllers,
        total_jobs=total_jobs,
        total_nodes=total_nodes,
        online_nodes=online_nodes,
        active_builds=active_builds,
        active_alerts=active_alerts,
        queue_depth=queue_depth,
    )


@router.get("/build-trends", response_model=List[BuildTrendItem])
def get_build_trends(days: int = 7, db: Session = Depends(get_db)):
    """Returns daily build volume breakdown across all controllers."""
    since = datetime.now(timezone.utc) - timedelta(days=days)
    builds = db.execute(
        select(Build).where(Build.created_at >= since)
    ).scalars().all()

    # Pre-populate map for last N days
    trend_map: Dict[str, Dict[str, int]] = {}
    for i in range(days):
        d_str = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        trend_map[d_str] = {"success": 0, "failure": 0, "unstable": 0, "aborted": 0}

    for b in builds:
        day_str = b.created_at.strftime("%Y-%m-%d") if b.created_at else None
        if not day_str or day_str not in trend_map:
            continue
        status = (b.normalized_status or "").upper()
        if status == "SUCCESS":
            trend_map[day_str]["success"] += 1
        elif status == "FAILURE":
            trend_map[day_str]["failure"] += 1
        elif status == "UNSTABLE":
            trend_map[day_str]["unstable"] += 1
        elif status == "ABORTED":
            trend_map[day_str]["aborted"] += 1

    return [
        BuildTrendItem(
            date=day,
            success=counts["success"],
            failure=counts["failure"],
            unstable=counts["unstable"],
            aborted=counts["aborted"],
        )
        for day, counts in trend_map.items()
    ]
