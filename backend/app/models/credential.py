import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base import Base


class CredentialReference(Base):
    __tablename__ = "credential_references"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    server_id = Column(UUID(as_uuid=True), ForeignKey("jenkins_servers.id", ondelete="CASCADE"), unique=True, nullable=False)
    auth_type = Column(String(50), default="TOKEN", nullable=False)  # TOKEN, BASIC
    username = Column(String(255), nullable=False)
    encrypted_secret = Column(Text, nullable=False)  # Fernet encrypted token or password
    encryption_key_id = Column(String(50), default="default", nullable=False)
    last_rotated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    server = relationship("JenkinsServer", back_populates="credential")
