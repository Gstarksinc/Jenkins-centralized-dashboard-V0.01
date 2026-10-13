import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, BigInteger, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    correlation_id = Column(UUID(as_uuid=True), default=uuid.uuid4, nullable=False, index=True)
    actor_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    # Actions: AUTH_LOGIN_SUCCESS, AUTH_LOGIN_FAILED, AUTH_LOGOUT, USER_CREATE, SERVER_CREATE, SERVER_UPDATE, BUILD_TRIGGER, etc.
    resource_type = Column(String(50), nullable=False, index=True)
    resource_id = Column(String(255), nullable=True)
    server_id = Column(UUID(as_uuid=True), ForeignKey("jenkins_servers.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(20), default="SUCCESS", nullable=False)  # SUCCESS, FAILURE
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    details = Column(JSON, default=dict, nullable=False)  # Sanitized, no secrets
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    actor = relationship("User")
    server = relationship("JenkinsServer")
