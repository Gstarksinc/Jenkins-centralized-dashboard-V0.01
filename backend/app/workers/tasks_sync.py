import uuid
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

from sqlalchemy.orm import Session
from sqlalchemy import select, and_

from app.workers.celery_app import celery
from app.db.session import SessionLocal
from app.models.server import JenkinsServer
from app.models.credential import CredentialReference
from app.models.job import Job
from app.models.build import Build
from app.models.node import Node
from app.models.metric import ServerMetric, CollectionRun
from app.models.alert import Alert
from app.core.security import decrypt_secret
from app.integrations.jenkins.client import JenkinsClient


def _get_or_create_alert(
    db: Session,
    server_id: uuid.UUID,
    alert_type: str,
    title: str,
    description: str,
    severity: str = "WARNING",
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
) -> Alert:
    """Helper to find an active alert or create a new one."""
    existing = db.execute(
        select(Alert).where(
            and_(
                Alert.server_id == server_id,
                Alert.alert_type == alert_type,
                Alert.resource_id == resource_id,
                Alert.status.in_(["ACTIVE", "ACKNOWLEDGED"]),
            )
        )
    ).scalar_one_or_none()

    if existing:
        existing.last_observed_at = datetime.now(timezone.utc)
        existing.description = description
        return existing

    new_alert = Alert(
        server_id=server_id,
        alert_type=alert_type,
        severity=severity,
        title=title,
        description=description,
        resource_type=resource_type,
        resource_id=resource_id,
        status="ACTIVE",
        first_detected_at=datetime.now(timezone.utc),
        last_observed_at=datetime.now(timezone.utc),
    )
    db.add(new_alert)
    return new_alert


def _resolve_alert_if_exists(
    db: Session,
    server_id: uuid.UUID,
    alert_type: str,
    resource_id: Optional[str] = None,
):
    """Marks an active or acknowledged alert as resolved."""
    query = select(Alert).where(
        and_(
            Alert.server_id == server_id,
            Alert.alert_type == alert_type,
            Alert.status.in_(["ACTIVE", "ACKNOWLEDGED"]),
        )
    )
    if resource_id is not None:
        query = query.where(Alert.resource_id == resource_id)

    alerts = db.execute(query).scalars().all()
    for alert in alerts:
        alert.status = "RESOLVED"
        alert.resolved_at = datetime.now(timezone.utc)


async def _run_sync(server_id_str: str) -> Dict[str, Any]:
    """Asynchronous sync logic for a single Jenkins controller."""
    server_uuid = uuid.UUID(server_id_str)

    with SessionLocal() as db:
        server = db.execute(
            select(JenkinsServer).where(JenkinsServer.id == server_uuid)
        ).scalar_one_or_none()

        if not server or not server.is_enabled:
            return {"status": "skipped", "reason": "Server not found or disabled"}

        # Track collection run
        collection_run = CollectionRun(
            server_id=server.id,
            category="ALL",
            status="RUNNING",
            started_at=datetime.now(timezone.utc),
        )
        db.add(collection_run)
        db.commit()
        db.refresh(collection_run)

        # Retrieve and decrypt credentials
        credential = db.execute(
            select(CredentialReference).where(CredentialReference.server_id == server.id)
        ).scalar_one_or_none()

        username = credential.username if credential else ""
        secret = ""
        if credential and credential.encrypted_secret:
            try:
                secret = decrypt_secret(credential.encrypted_secret)
            except Exception:
                secret = ""

        client = JenkinsClient(
            base_url=server.base_url,
            username=username,
            token_or_password=secret,
            auth_type=credential.auth_type if credential else "TOKEN",
            timeout_seconds=server.connection_timeout_seconds,
        )

        # 1. Test connectivity
        conn_result = await client.test_connection()
        if not conn_result.get("online"):
            server.status = conn_result.get("status", "OFFLINE")
            server.last_error_message = conn_result.get("message", "Controller unreachable")
            collection_run.status = "FAILED"
            collection_run.error_details = server.last_error_message
            collection_run.completed_at = datetime.now(timezone.utc)

            _get_or_create_alert(
                db=db,
                server_id=server.id,
                alert_type="CONTROLLER_UNREACHABLE",
                title=f"Jenkins Controller '{server.name}' Unreachable",
                description=server.last_error_message,
                severity="CRITICAL",
                resource_type="server",
                resource_id=str(server.id),
            )
            db.commit()
            return {"status": "failed", "reason": server.last_error_message}

        # Connection successful
        server.status = "ONLINE"
        server.version_info = conn_result.get("version", "Unknown")
        server.last_successful_sync = datetime.now(timezone.utc)
        server.last_error_message = None

        _resolve_alert_if_exists(
            db=db,
            server_id=server.id,
            alert_type="CONTROLLER_UNREACHABLE",
            resource_id=str(server.id),
        )

        total_items = 0

        # 2. Fetch Jobs and Builds
        try:
            raw_jobs = await client.fetch_jobs_and_builds()
            total_items += len(raw_jobs)

            for rj in raw_jobs:
                job_name = rj.get("name")
                if not job_name:
                    continue

                full_path = rj.get("url", f"{server.base_url}/job/{job_name}")
                job_type = rj.get("_class", "").split(".")[-1] or "Job"
                is_buildable = rj.get("buildable", True)

                job = db.execute(
                    select(Job).where(
                        and_(Job.server_id == server.id, Job.name == job_name)
                    )
                ).scalar_one_or_none()

                if not job:
                    job = Job(
                        server_id=server.id,
                        name=job_name,
                        full_path=full_path,
                    )
                    db.add(job)
                    db.flush()

                job.job_type = job_type
                job.is_buildable = is_buildable

                last_b = rj.get("lastBuild")
                last_succ = rj.get("lastSuccessfulBuild")
                last_fail = rj.get("lastFailedBuild")

                if last_succ:
                    job.last_successful_build_number = last_succ.get("number")
                if last_fail:
                    job.last_failed_build_number = last_fail.get("number")

                if last_b:
                    b_num = last_b.get("number")
                    b_res = last_b.get("result")
                    b_ts = last_b.get("timestamp")

                    job.last_build_number = b_num
                    job.last_build_result = b_res
                    if b_ts:
                        job.last_build_timestamp = datetime.fromtimestamp(b_ts / 1000.0, tz=timezone.utc)

                    if b_res == "SUCCESS":
                        job.health_score = 100
                    elif b_res == "UNSTABLE":
                        job.health_score = 50
                    elif b_res == "FAILURE":
                        job.health_score = 0
                    else:
                        job.health_score = 80

                    # Ingest Build record
                    if b_num is not None:
                        build = db.execute(
                            select(Build).where(
                                and_(Build.job_id == job.id, Build.build_number == b_num)
                            )
                        ).scalar_one_or_none()

                        if not build:
                            build = Build(
                                job_id=job.id,
                                server_id=server.id,
                                build_number=b_num,
                            )
                            db.add(build)

                        # Status normalization
                        if b_res is None:
                            norm_status = "RUNNING"
                        elif b_res in ("SUCCESS", "FAILURE", "UNSTABLE", "ABORTED", "NOT_BUILT"):
                            norm_status = b_res
                        else:
                            norm_status = "UNKNOWN"

                        build.normalized_status = norm_status
                        build.jenkins_result = b_res
                        if b_ts:
                            build.start_time = datetime.fromtimestamp(b_ts / 1000.0, tz=timezone.utc)
                        build.duration_ms = last_b.get("duration")
                        build.build_url = last_b.get("url")

        except Exception as e:
            server.last_error_message = f"Error fetching jobs: {str(e)}"

        # 3. Fetch Nodes
        total_executors = 0
        total_busy = 0
        total_idle = 0

        try:
            raw_nodes = await client.fetch_nodes()
            total_items += len(raw_nodes)

            for rn in raw_nodes:
                node_name = rn.get("displayName", "master")
                is_offline = rn.get("offline", False)
                offline_cause = rn.get("offlineCauseReason") if is_offline else None
                num_exec = rn.get("numExecutors", 0)

                executors = rn.get("executors", [])
                busy_exec = sum(1 for ex in executors if not ex.get("idle", True))
                idle_exec = max(0, num_exec - busy_exec)

                total_executors += num_exec
                total_busy += busy_exec
                total_idle += idle_exec

                labels = [lbl.get("name") for lbl in rn.get("assignedLabels", []) if lbl.get("name")]

                node = db.execute(
                    select(Node).where(
                        and_(Node.server_id == server.id, Node.name == node_name)
                    )
                ).scalar_one_or_none()

                if not node:
                    node = Node(
                        server_id=server.id,
                        name=node_name,
                    )
                    db.add(node)

                node.is_online = not is_offline
                node.offline_cause = str(offline_cause) if offline_cause else None
                node.num_executors = num_exec
                node.busy_executors = busy_exec
                node.idle_executors = idle_exec
                node.labels = labels
                node.last_seen_at = datetime.now(timezone.utc)

                if is_offline:
                    _get_or_create_alert(
                        db=db,
                        server_id=server.id,
                        alert_type="NODE_OFFLINE",
                        title=f"Node '{node_name}' is Offline on {server.name}",
                        description=str(offline_cause) if offline_cause else f"Agent node '{node_name}' is disconnected or offline.",
                        severity="WARNING",
                        resource_type="node",
                        resource_id=node_name,
                    )
                else:
                    _resolve_alert_if_exists(
                        db=db,
                        server_id=server.id,
                        alert_type="NODE_OFFLINE",
                        resource_id=node_name,
                    )
        except Exception as e:
            server.last_error_message = f"Error fetching nodes: {str(e)}"

        # 4. Fetch Queue & Metrics
        queue_length = 0
        try:
            raw_queue = await client.fetch_queue()
            queue_length = len(raw_queue)

            if queue_length > 10:
                _get_or_create_alert(
                    db=db,
                    server_id=server.id,
                    alert_type="QUEUE_HIGH",
                    title=f"High Build Queue on {server.name} ({queue_length} builds queued)",
                    description=f"Queue length has exceeded threshold with {queue_length} jobs waiting for available executors.",
                    severity="WARNING",
                    resource_type="server",
                    resource_id=str(server.id),
                )
            else:
                _resolve_alert_if_exists(
                    db=db,
                    server_id=server.id,
                    alert_type="QUEUE_HIGH",
                    resource_id=str(server.id),
                )

            # Record Server Metric snapshot
            metric = ServerMetric(
                server_id=server.id,
                queue_length=queue_length,
                active_build_count=total_busy,
                available_executors=total_idle,
                busy_executors=total_busy,
                recorded_at=datetime.now(timezone.utc),
            )
            db.add(metric)
        except Exception as e:
            server.last_error_message = f"Error fetching queue/metrics: {str(e)}"

        # Finalize collection run
        collection_run.status = "SUCCESS"
        collection_run.items_collected = total_items
        collection_run.completed_at = datetime.now(timezone.utc)
        db.commit()

        return {
            "status": "success",
            "server": server.name,
            "items_collected": total_items,
            "queue_length": queue_length,
        }


@celery.task(name="app.workers.tasks_sync.sync_single_server_task")
def sync_single_server_task(server_id: str) -> Dict[str, Any]:
    """Celery task worker for syncing a single Jenkins server."""
    return asyncio.run(_run_sync(server_id))


@celery.task(name="app.workers.tasks_sync.sync_all_servers_task")
def sync_all_servers_task() -> Dict[str, Any]:
    """Celery Beat scheduled task that scans all enabled Jenkins controllers and triggers sync."""
    with SessionLocal() as db:
        servers = db.execute(
            select(JenkinsServer).where(JenkinsServer.is_enabled == True)
        ).scalars().all()

        server_ids = [str(s.id) for s in servers]

    for sid in server_ids:
        sync_single_server_task.delay(sid)

    return {"servers_queued": len(server_ids)}
