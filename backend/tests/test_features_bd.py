import uuid
from datetime import datetime, timezone
from app.models.server import JenkinsServer
from app.models.job import Job
from app.models.build import Build
from app.models.node import Node
from app.models.alert import Alert


def test_dashboard_summary_and_trends(client, db_session):
    server = JenkinsServer(
        name="Dashboard Controller",
        base_url="http://192.168.1.50:8080",
        environment="production",
        status="ONLINE",
    )
    db_session.add(server)
    db_session.flush()

    job = Job(
        server_id=server.id,
        name="deploy-pipeline",
        full_path="http://192.168.1.50:8080/job/deploy-pipeline",
        job_type="WorkflowJob",
        is_buildable=True,
        last_build_number=42,
        last_build_result="SUCCESS",
        health_score=100,
    )
    db_session.add(job)
    db_session.flush()

    build = Build(
        job_id=job.id,
        server_id=server.id,
        build_number=42,
        normalized_status="SUCCESS",
        jenkins_result="SUCCESS",
        start_time=datetime.now(timezone.utc),
        duration_ms=45000,
    )
    db_session.add(build)

    node = Node(
        server_id=server.id,
        name="worker-1",
        is_online=True,
        num_executors=4,
        busy_executors=1,
        idle_executors=3,
    )
    db_session.add(node)

    alert = Alert(
        server_id=server.id,
        alert_type="NODE_OFFLINE",
        severity="WARNING",
        title="Test Alert",
        description="Node disconnected",
        status="ACTIVE",
    )
    db_session.add(alert)
    db_session.commit()

    # 1. Summary
    resp = client.get("/api/v1/dashboard/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_controllers"] >= 1
    assert data["online_controllers"] >= 1
    assert data["total_jobs"] >= 1
    assert data["total_nodes"] >= 1
    assert data["active_alerts"] >= 1

    # 2. Build trends
    trends_resp = client.get("/api/v1/dashboard/build-trends?days=7")
    assert trends_resp.status_code == 200
    trends = trends_resp.json()
    assert len(trends) == 7


def test_jobs_api(client, db_session):
    server = JenkinsServer(
        name="Jobs Controller",
        base_url="http://192.168.1.51:8080",
        environment="production",
        status="ONLINE",
    )
    db_session.add(server)
    db_session.flush()

    job = Job(
        server_id=server.id,
        name="microservice-build",
        full_path="http://192.168.1.51:8080/job/microservice-build",
        is_buildable=True,
        health_score=90,
    )
    db_session.add(job)
    db_session.commit()

    resp = client.get("/api/v1/jobs")
    assert resp.status_code == 200
    data = resp.json()
    assert any(j["name"] == "microservice-build" for j in data)


def test_nodes_api(client, db_session):
    server = JenkinsServer(
        name="Nodes Controller",
        base_url="http://192.168.1.52:8080",
        environment="staging",
        status="ONLINE",
    )
    db_session.add(server)
    db_session.flush()

    node = Node(
        server_id=server.id,
        name="builder-node-agent",
        is_online=True,
        num_executors=2,
        busy_executors=0,
        idle_executors=2,
    )
    db_session.add(node)
    db_session.commit()

    resp = client.get("/api/v1/nodes")
    assert resp.status_code == 200
    data = resp.json()
    assert any(n["name"] == "builder-node-agent" for n in data)


def test_alerts_api(client, db_session):
    server = JenkinsServer(
        name="Alert Controller",
        base_url="http://192.168.1.53:8080",
        environment="production",
        status="ONLINE",
    )
    db_session.add(server)
    db_session.flush()

    alert = Alert(
        server_id=server.id,
        alert_type="QUEUE_HIGH",
        severity="WARNING",
        title="High queue detected",
        description="Queue exceeded threshold",
        status="ACTIVE",
    )
    db_session.add(alert)
    db_session.commit()
    alert_id = str(alert.id)

    # List alerts
    resp = client.get("/api/v1/alerts")
    assert resp.status_code == 200
    alerts = resp.json()
    assert any(a["id"] == alert_id for a in alerts)

    # Acknowledge
    ack_resp = client.patch(f"/api/v1/alerts/{alert_id}/acknowledge")
    assert ack_resp.status_code == 200
    assert ack_resp.json()["status"] == "ACKNOWLEDGED"

    # Resolve
    res_resp = client.patch(f"/api/v1/alerts/{alert_id}/resolve")
    assert res_resp.status_code == 200
    assert res_resp.json()["status"] == "RESOLVED"
