import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Table, Boolean, Integer, Text, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

jenkins_server_access = Table(
    "jenkins_server_access",
    Base.metadata,
    Column("server_id", UUID(as_uuid=True), ForeignKey("jenkins_servers.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
    Column("team_id", UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=True),
    Column("access_level", String(50), default="READ", nullable=False),  # READ, OPERATE, ADMINISTER
)


class JenkinsServer(Base):
    __tablename__ = "jenkins_servers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False, index=True)
    base_url = Column(String(500), nullable=False)
    environment = Column(String(50), default="production", nullable=False)  # development, staging, production, custom
    description = Column(String(500), nullable=True)
    status = Column(String(50), default="UNVERIFIED", nullable=False)
    # Statuses: ONLINE, OFFLINE, DEGRADED, AUTH_FAILED, PERMISSION_DENIED, UNVERIFIED, DISABLED, STALE
    is_enabled = Column(Boolean, default=True, nullable=False)
    collection_interval_seconds = Column(Integer, default=60, nullable=False)
    connection_timeout_seconds = Column(Integer, default=15, nullable=False)
    owner_team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    tags = Column(JSON, default=list, nullable=False)

    version_info = Column(String(100), nullable=True)
    last_successful_sync = Column(DateTime(timezone=True), nullable=True)
    last_error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    credential = relationship("CredentialReference", back_populates="server", uselist=False, cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="server", cascade="all, delete-orphan")
    nodes = relationship("Node", back_populates="server", cascade="all, delete-orphan")
    metrics = relationship("ServerMetric", back_populates="server", cascade="all, delete-orphan")
    collection_runs = relationship("CollectionRun", back_populates="server", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="server", cascade="all, delete-orphan")
