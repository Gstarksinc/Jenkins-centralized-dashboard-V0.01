import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Float, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    rule_type = Column(String(50), nullable=False)
    # Types: CONTROLLER_UNREACHABLE, AUTH_FAILURE, DISK_HIGH, CPU_HIGH, MEMORY_HIGH, NODE_OFFLINE, QUEUE_HIGH, REPEATED_FAILURES, STALE_DATA
    severity = Column(String(20), default="WARNING", nullable=False)  # WARNING, CRITICAL
    threshold_value = Column(Float, nullable=True)
    cooldown_minutes = Column(Float, default=15, nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    alerts = relationship("Alert", back_populates="rule", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_id = Column(UUID(as_uuid=True), ForeignKey("alert_rules.id", ondelete="SET NULL"), nullable=True)
    server_id = Column(UUID(as_uuid=True), ForeignKey("jenkins_servers.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), default="WARNING", nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    resource_type = Column(String(50), nullable=True)  # server, job, node
    resource_id = Column(String(255), nullable=True)

    status = Column(String(50), default="ACTIVE", nullable=False, index=True)  # ACTIVE, ACKNOWLEDGED, RESOLVED
    first_detected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_observed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    server = relationship("JenkinsServer", back_populates="alerts")
    rule = relationship("AlertRule", back_populates="alerts")
    acknowledged_by = relationship("User")
