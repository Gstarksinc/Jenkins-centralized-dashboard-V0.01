from typing import List
from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.session import get_db
from app.models.server import JenkinsServer
from app.models.credential import CredentialReference
from app.schemas.server import (
    JenkinsServerCreate,
    JenkinsServerUpdate,
    JenkinsServerResponse,
    ConnectionTestRequest,
    ConnectionTestResponse,
)
from app.core.security import encrypt_secret, decrypt_secret
from app.core.ssrf_guard import SSRFValidationError
from app.integrations.jenkins.client import JenkinsClient

router = APIRouter(prefix="/servers", tags=["Jenkins Servers"])


@router.post("/test-connection", response_model=ConnectionTestResponse)
async def test_server_connection(payload: ConnectionTestRequest):
    """
    Test connectivity and credentials against a Jenkins controller before registering.
    Protected by SSRF validation.
    """
    client = JenkinsClient(
        base_url=payload.base_url,
        username=payload.username,
        token_or_password=payload.secret_token,
        auth_type=payload.auth_type,
        timeout_seconds=payload.connection_timeout_seconds,
    )
    try:
        result = await client.test_connection()
        return ConnectionTestResponse(
            online=result["online"],
            status=result["status"],
            version=result.get("version"),
            message=result["message"],
            description=result.get("description"),
        )
    except SSRFValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SSRF Policy Violation: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Connection test failure: {str(e)}",
        )


@router.get("", response_model=List[JenkinsServerResponse])
def list_servers(db: Session = Depends(get_db)):
    """List all registered Jenkins controllers."""
    servers = db.execute(select(JenkinsServer).order_by(JenkinsServer.name)).scalars().all()
    return servers


@router.post("", response_model=JenkinsServerResponse, status_code=status.HTTP_201_CREATED)
async def create_server(payload: JenkinsServerCreate, db: Session = Depends(get_db)):
    """
    Register a new Jenkins controller.
    Validates URL against SSRF policy, tests connectivity, and saves encrypted credentials.
    """
    # Check if server with same name exists
    existing = db.execute(select(JenkinsServer).where(JenkinsServer.name == payload.name)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A Jenkins server with name '{payload.name}' already exists.",
        )

    # 1. Test connectivity and check SSRF
    client = JenkinsClient(
        base_url=payload.base_url,
        username=payload.username,
        token_or_password=payload.secret_token,
        auth_type=payload.auth_type,
        timeout_seconds=payload.connection_timeout_seconds,
    )
    try:
        test_res = await client.test_connection()
    except SSRFValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"SSRF Policy Violation: {str(e)}",
        )

    # 2. Persist JenkinsServer record
    server = JenkinsServer(
        name=payload.name,
        base_url=payload.base_url.rstrip("/"),
        environment=payload.environment,
        description=payload.description,
        status=test_res.get("status", "UNVERIFIED"),
        collection_interval_seconds=payload.collection_interval_seconds,
        connection_timeout_seconds=payload.connection_timeout_seconds,
        tags=payload.tags,
        version_info=test_res.get("version"),
        last_successful_sync=datetime.now(timezone.utc) if test_res.get("online") else None,
        last_error_message=None if test_res.get("online") else test_res.get("message"),
    )
    db.add(server)
    db.flush()  # Generate server.id

    # 3. Persist encrypted credentials
    encrypted_secret = encrypt_secret(payload.secret_token)
    credential = CredentialReference(
        server_id=server.id,
        auth_type=payload.auth_type,
        username=payload.username,
        encrypted_secret=encrypted_secret,
        encryption_key_id="default",
    )
    db.add(credential)
    db.commit()
    db.refresh(server)
    return server


@router.get("/{server_id}", response_model=JenkinsServerResponse)
def get_server(server_id: UUID, db: Session = Depends(get_db)):
    """Retrieve details for a single Jenkins controller."""
    server = db.execute(select(JenkinsServer).where(JenkinsServer.id == server_id)).scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jenkins server not found.")
    return server


@router.patch("/{server_id}", response_model=JenkinsServerResponse)
def update_server(server_id: UUID, payload: JenkinsServerUpdate, db: Session = Depends(get_db)):
    """Update registration settings or rotate credentials for a Jenkins controller."""
    server = db.execute(select(JenkinsServer).where(JenkinsServer.id == server_id)).scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jenkins server not found.")

    if payload.name is not None:
        server.name = payload.name
    if payload.environment is not None:
        server.environment = payload.environment
    if payload.description is not None:
        server.description = payload.description
    if payload.is_enabled is not None:
        server.is_enabled = payload.is_enabled
    if payload.collection_interval_seconds is not None:
        server.collection_interval_seconds = payload.collection_interval_seconds
    if payload.connection_timeout_seconds is not None:
        server.connection_timeout_seconds = payload.connection_timeout_seconds
    if payload.tags is not None:
        server.tags = payload.tags

    # Credential update / rotation
    if payload.username is not None or payload.secret_token is not None:
        cred = db.execute(select(CredentialReference).where(CredentialReference.server_id == server.id)).scalar_one_or_none()
        if cred:
            if payload.username is not None:
                cred.username = payload.username
            if payload.secret_token is not None:
                cred.encrypted_secret = encrypt_secret(payload.secret_token)
                cred.last_rotated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(server)
    return server


@router.delete("/{server_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_server(server_id: UUID, db: Session = Depends(get_db)):
    """Remove a Jenkins controller registration and associated credentials."""
    server = db.execute(select(JenkinsServer).where(JenkinsServer.id == server_id)).scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jenkins server not found.")

    db.delete(server)
    db.commit()
    return None


@router.post("/{server_id}/test-connection", response_model=ConnectionTestResponse)
async def test_existing_server_connection(server_id: UUID, db: Session = Depends(get_db)):
    """Re-test connection against an existing controller using its stored encrypted credentials."""
    server = db.execute(select(JenkinsServer).where(JenkinsServer.id == server_id)).scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Jenkins server not found.")

    cred = db.execute(select(CredentialReference).where(CredentialReference.server_id == server.id)).scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No credentials found for this server.")

    secret_token = decrypt_secret(cred.encrypted_secret)
    client = JenkinsClient(
        base_url=server.base_url,
        username=cred.username,
        token_or_password=secret_token,
        auth_type=cred.auth_type,
        timeout_seconds=server.connection_timeout_seconds,
    )
    result = await client.test_connection()

    # Update server health state in DB
    server.status = result.get("status", "UNVERIFIED")
    if result.get("version"):
        server.version_info = result["version"]
    if result.get("online"):
        server.last_successful_sync = datetime.now(timezone.utc)
        server.last_error_message = None
    else:
        server.last_error_message = result.get("message")

    db.commit()

    return ConnectionTestResponse(
        online=result["online"],
        status=result["status"],
        version=result.get("version"),
        message=result["message"],
        description=result.get("description"),
    )
