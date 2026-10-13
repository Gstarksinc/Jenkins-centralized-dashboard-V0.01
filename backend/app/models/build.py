import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, BigInteger, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class Build(Base):
    __tablename__ = "builds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    server_id = Column(UUID(as_uuid=True), ForeignKey("jenkins_servers.id", ondelete="CASCADE"), nullable=False, index=True)
    build_number = Column(Integer, nullable=False)

    # Normalized status: RUNNING, QUEUED, SUCCESS, FAILURE, UNSTABLE, ABORTED, NOT_BUILT, UNKNOWN
    normalized_status = Column(String(50), default="UNKNOWN", nullable=False, index=True)
    jenkins_result = Column(String(50), nullable=True)

    start_time = Column(DateTime(timezone=True), nullable=True, index=True)
    completion_time = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(BigInteger, nullable=True)

    triggered_by = Column(String(255), nullable=True)
    vcs_branch = Column(String(255), nullable=True)
    vcs_commit = Column(String(100), nullable=True)
    build_url = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("job_id", "build_number", name="uq_job_build_number"),
    )

    job = relationship("Job", back_populates="builds")
    server = relationship("JenkinsServer")
