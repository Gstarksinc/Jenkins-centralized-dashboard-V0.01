import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Table, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base

jenkins_job_access = Table(
    "jenkins_job_access",
    Base.metadata,
    Column("job_id", UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
    Column("team_id", UUID(as_uuid=True), ForeignKey("teams.id", ondelete="CASCADE"), nullable=True),
    Column("can_trigger", Boolean, default=False, nullable=False),
)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    server_id = Column(UUID(as_uuid=True), ForeignKey("jenkins_servers.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    full_path = Column(String(500), nullable=False)
    folder = Column(String(255), nullable=True)
    job_type = Column(String(100), nullable=True)  # Freestyle, Pipeline, MultiBranch, etc.
    is_buildable = Column(Boolean, default=True, nullable=False)

    last_build_number = Column(Integer, nullable=True)
    last_build_result = Column(String(50), nullable=True)
    last_build_timestamp = Column(DateTime(timezone=True), nullable=True)
    last_successful_build_number = Column(Integer, nullable=True)
    last_failed_build_number = Column(Integer, nullable=True)
    health_score = Column(Integer, nullable=True)  # 0 to 100

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    server = relationship("JenkinsServer", back_populates="jobs")
    builds = relationship("Build", back_populates="job", cascade="all, delete-orphan")
