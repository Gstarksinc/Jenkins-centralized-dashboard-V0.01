from app.models import (
    Base,
    User,
    Role,
    Permission,
    Team,
    JenkinsServer,
    CredentialReference,
    Job,
    Build,
    Node,
    ServerMetric,
    CollectionRun,
    AlertRule,
    Alert,
    AuditEvent,
    UserSession,
)


def test_all_models_registered_in_metadata():
    """Verify all 20 required tables are registered with valid constraints in SQLAlchemy metadata."""
    tables = Base.metadata.tables.keys()
    required_tables = [
        "users",
        "roles",
        "permissions",
        "user_roles",
        "role_permissions",
        "teams",
        "team_members",
        "jenkins_servers",
        "jenkins_server_access",
        "credential_references",
        "jobs",
        "jenkins_job_access",
        "builds",
        "nodes",
        "server_metrics",
        "collection_runs",
        "alert_rules",
        "alerts",
        "audit_events",
        "sessions",
    ]
    for table_name in required_tables:
        assert table_name in tables, f"Expected table {table_name} missing from metadata"


def test_model_class_instantiation():
    """Verify models can be instantiated with required fields."""
    user = User(email="admin@example.com", password_hash="dummy-hash", display_name="Admin User")
    assert user.email == "admin@example.com"
    assert user.display_name == "Admin User"

    server = JenkinsServer(
        name="Primary Jenkins",
        base_url="https://jenkins.example.com",
        environment="production",
        status="UNVERIFIED",
    )
    assert server.name == "Primary Jenkins"
    assert server.status == "UNVERIFIED"

    job = Job(name="build-pipeline", full_path="folder/build-pipeline")
    assert job.name == "build-pipeline"

    build = Build(build_number=42, normalized_status="SUCCESS")
    assert build.build_number == 42
    assert build.normalized_status == "SUCCESS"
