import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, desc

from app.db.session import get_db
from app.models.build import Build
from app.models.job import Job
from app.models.server import JenkinsServer
from app.models.credential import CredentialReference
from app.schemas.build import BuildResponse, ConsoleLogResponse
from app.core.security import decrypt_secret
from app.integrations.jenkins.client import JenkinsClient

router = APIRouter(prefix="/builds", tags=["Builds"])


@router.get("", response_model=List[BuildResponse])
def list_builds(
    server_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List recent build runs across all registered Jenkins controllers."""
    query = (
        select(
            Build,
            Job.name.label("job_name"),
            JenkinsServer.name.label("server_name"),
        )
        .join(Job, Build.job_id == Job.id)
        .join(JenkinsServer, Build.server_id == JenkinsServer.id)
    )

    if server_id:
        query = query.where(Build.server_id == server_id)
    if status:
        query = query.where(Build.normalized_status == status.upper())

    query = query.order_by(desc(Build.created_at)).offset(offset).limit(limit)
    rows = db.execute(query).all()

    result = []
    for build, job_name, server_name in rows:
        resp = BuildResponse.model_validate(build)
        resp.job_name = job_name
        resp.server_name = server_name
        result.append(resp)

    return result


@router.get("/{build_id}/console", response_model=ConsoleLogResponse)
async def get_build_console_log(
    build_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Fetch live or completed console output for a build run."""
    build = db.execute(select(Build).where(Build.id == build_id)).scalar_one_or_none()
    if not build:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Build not found.")

    job = db.execute(select(Job).where(Job.id == build.job_id)).scalar_one_or_none()
    server = db.execute(select(JenkinsServer).where(JenkinsServer.id == build.server_id)).scalar_one_or_none()
    if not job or not server:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated job or server missing.")

    cred = db.execute(select(CredentialReference).where(CredentialReference.server_id == server.id)).scalar_one_or_none()
    secret = decrypt_secret(cred.encrypted_secret) if cred and cred.encrypted_secret else ""

    client = JenkinsClient(
        base_url=server.base_url,
        username=cred.username if cred else "",
        token_or_password=secret,
        auth_type=cred.auth_type if cred else "TOKEN",
        timeout_seconds=server.connection_timeout_seconds,
    )

    log_content = await client.fetch_console_log(job_name=job.name, build_number=build.build_number)

    return ConsoleLogResponse(
        build_id=build.id,
        job_name=job.name,
        build_number=build.build_number,
        log_content=log_content,
    )
