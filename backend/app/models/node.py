import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Integer, JSON, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class Node(Base):
    __tablename__ = "nodes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    server_id = Column(UUID(as_uuid=True), ForeignKey("jenkins_servers.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    is_online = Column(Boolean, default=True, nullable=False)
    offline_cause = Column(String(500), nullable=True)

    num_executors = Column(Integer, default=1, nullable=False)
    busy_executors = Column(Integer, default=0, nullable=False)
    idle_executors = Column(Integer, default=1, nullable=False)

    labels = Column(JSON, default=list, nullable=False)
    last_seen_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("server_id", "name", name="uq_server_node_name"),
    )

    server = relationship("JenkinsServer", back_populates="nodes")
