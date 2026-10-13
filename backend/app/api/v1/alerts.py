import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, desc

from app.db.session import get_db
from app.models.alert import Alert
from app.models.server import JenkinsServer
from app.schemas.alert import AlertResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertResponse])
def list_alerts(
    server_id: Optional[uuid.UUID] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """List operational and health alerts across controllers."""
    query = (
        select(Alert, JenkinsServer.name.label("server_name"))
        .join(JenkinsServer, Alert.server_id == JenkinsServer.id)
    )

    if server_id:
        query = query.where(Alert.server_id == server_id)
    if status_filter:
        query = query.where(Alert.status == status_filter.upper())
    if severity:
        query = query.where(Alert.severity == severity.upper())

    query = query.order_by(desc(Alert.last_observed_at)).limit(limit)
    rows = db.execute(query).all()

    result = []
    for alert, server_name in rows:
        resp = AlertResponse.model_validate(alert)
        resp.server_name = server_name
        result.append(resp)

    return result


@router.patch("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Mark an alert as acknowledged."""
    alert = db.execute(select(Alert).where(Alert.id == alert_id)).scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found.")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)

    server = db.execute(select(JenkinsServer).where(JenkinsServer.id == alert.server_id)).scalar_one_or_none()
    resp = AlertResponse.model_validate(alert)
    resp.server_name = server.name if server else None

    AuditService.log_event(
        db=db,
        action="ACKNOWLEDGE_ALERT",
        resource_type="alert",
        resource_id=str(alert.id),
        server_id=alert.server_id,
        details={"alert_type": alert.alert_type, "title": alert.title},
    )

    return resp


@router.patch("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Mark an alert as resolved."""
    alert = db.execute(select(Alert).where(Alert.id == alert_id)).scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found.")

    alert.status = "RESOLVED"
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)

    server = db.execute(select(JenkinsServer).where(JenkinsServer.id == alert.server_id)).scalar_one_or_none()
    resp = AlertResponse.model_validate(alert)
    resp.server_name = server.name if server else None

    AuditService.log_event(
        db=db,
        action="RESOLVE_ALERT",
        resource_type="alert",
        resource_id=str(alert.id),
        server_id=alert.server_id,
        details={"alert_type": alert.alert_type, "title": alert.title},
    )

    return resp
