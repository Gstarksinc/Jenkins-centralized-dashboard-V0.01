import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.audit import AuditEvent


class AuditService:
    @staticmethod
    def log_event(
        db: Session,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        actor_user_id: Optional[uuid.UUID] = None,
        server_id: Optional[uuid.UUID] = None,
        status: str = "SUCCESS",
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[uuid.UUID] = None,
    ) -> AuditEvent:
        """Records an append-only audit event for security and operational compliance."""
        event = AuditEvent(
            correlation_id=correlation_id or uuid.uuid4(),
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            server_id=server_id,
            status=status,
            ip_address=ip_address,
            user_agent=user_agent[:255] if user_agent else None,
            details=details or {},
            timestamp=datetime.now(timezone.utc),
        )
        db.add(event)
        try:
            db.commit()
            db.refresh(event)
        except Exception:
            db.rollback()
        return event
