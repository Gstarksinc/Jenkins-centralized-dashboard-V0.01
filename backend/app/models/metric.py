import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Float, BigInteger, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class ServerMetric(Base):
    __tablename__ = "server_metrics"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    server_id = Column(UUID(as_uuid=True), ForeignKey("jenkins_servers.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    cpu_usage_pct = Column(Float, nullable=True)
    memory_usage_pct = Column(Float, nullable=True)
    disk_usage_pct = Column(Float, nullable=True)

    queue_length = Column(Integer, default=0, nullable=False)
    active_build_count = Column(Integer, default=0, nullable=False)
    available_executors = Column(Integer, default=0, nullable=False)
    busy_executors = Column(Integer, default=0, nullable=False)

    server = relationship("JenkinsServer", back_populates="metrics")


class CollectionRun(Base):
    __tablename__ = "collection_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    server_id = Column(UUID(as_uuid=True), ForeignKey("jenkins_servers.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    category = Column(String(50), nullable=False)  # HEALTH, JOBS, BUILDS, NODES, QUEUE
    status = Column(String(50), default="RUNNING", nullable=False)  # SUCCESS, FAILED, TIMEOUT
    items_collected = Column(Integer, default=0, nullable=False)
    error_details = Column(Text, nullable=True)

    server = relationship("JenkinsServer", back_populates="collection_runs")
