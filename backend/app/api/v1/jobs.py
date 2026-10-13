import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, desc

from app.db.session import get_db
from app.models.job import Job
from app.models.build import Build
from app.models.server import JenkinsServer
from app.models.credential import CredentialReference
from app.schemas.job import JobResponse
from app.schemas.build import BuildResponse
from app.core.security import decrypt_secret
from app.integrations.jenkins.client import JenkinsClient
from app.services.audit_service import AuditService

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=List[JobResponse])
def list_jobs(
    server_id: Optional[uuid.UUID] = None,
    q: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    """List CI/CD jobs across all registered Jenkins controllers."""
    query = select(Job, JenkinsServer.name.label("server_name")).join(
        JenkinsServer, Job.server_id == JenkinsServer.id
    )

    if server_id:
        query = query.where(Job.server_id == server_id)
    if q:
        query = query.where(Job.name.ilike(f"%{q}%"))

    query = query.order_by(Job.name.asc()).offset(offset).limit(limit)
    rows = db.execute(query).all()

    result = []
    for job, server_name in rows:
        resp = JobResponse.model_validate(job)
        resp.server_name = server_name
        result.append(resp)

    return result


@router.get("/{job_id}/builds", response_model=List[BuildResponse])
def get_job_builds(
    job_id: uuid.UUID,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Retrieve recent builds for a specific job."""
    job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    server = db.execute(select(JenkinsServer).where(JenkinsServer.id == job.server_id)).scalar_one_or_none()
    server_name = server.name if server else None

    builds = db.execute(
        select(Build)
        .where(Build.job_id == job_id)
        .order_by(desc(Build.build_number))
        .limit(limit)
    ).scalars().all()

    result = []
    for b in builds:
        resp = BuildResponse.model_validate(b)
        resp.job_name = job.name
        resp.server_name = server_name
        result.append(resp)

    return result


@router.post("/{job_id}/build")
async def trigger_job_build(
    job_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Trigger a build execution on the upstream Jenkins controller."""
    job = db.execute(select(Job).where(Job.id == job_id)).scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")

    server = db.execute(select(JenkinsServer).where(JenkinsServer.id == job.server_id)).scalar_one_or_none()
    if not server:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated Jenkins server not found.")

    cred = db.execute(select(CredentialReference).where(CredentialReference.server_id == server.id)).scalar_one_or_none()
    secret = decrypt_secret(cred.encrypted_secret) if cred and cred.encrypted_secret else ""

    client = JenkinsClient(
        base_url=server.base_url,
        username=cred.username if cred else "",
        token_or_password=secret,
        auth_type=cred.auth_type if cred else "TOKEN",
        timeout_seconds=server.connection_timeout_seconds,
    )

    success = await client.trigger_build(job.name)

    AuditService.log_event(
        db=db,
        action="TRIGGER_BUILD",
        resource_type="job",
        resource_id=str(job.id),
        server_id=server.id,
        status="SUCCESS" if success else "FAILURE",
        details={"job_name": job.name, "server_name": server.name},
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to trigger build for job '{job.name}' on {server.name}. Verify server status and build permissions.",
        )

    return {
        "status": "queued",
        "message": f"Successfully requested build trigger for {job.name}",
        "job_id": str(job.id),
    }
