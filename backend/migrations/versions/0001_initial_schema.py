"""0001 initial schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-13 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Permissions
    op.create_table(
        'permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_permissions_name', 'permissions', ['name'])

    # 2. Roles
    op.create_table(
        'roles',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('is_system', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_roles_name', 'roles', ['name'])

    # 3. Role Permissions
    op.create_table(
        'role_permissions',
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('permission_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('permissions.id', ondelete='CASCADE'), primary_key=True),
    )

    # 4. Users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('display_name', sa.String(100), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='ACTIVE'),
        sa.Column('is_bootstrap_admin', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('locked_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_email', 'users', ['email'])

    # 5. User Roles
    op.create_table(
        'user_roles',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    )

    # 6. Teams
    op.create_table(
        'teams',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_teams_name', 'teams', ['name'])

    # 7. Team Members
    op.create_table(
        'team_members',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('role_in_team', sa.String(50), nullable=False, server_default='member'),
    )

    # 8. Jenkins Servers
    op.create_table(
        'jenkins_servers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('base_url', sa.String(500), nullable=False),
        sa.Column('environment', sa.String(50), nullable=False, server_default='production'),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='UNVERIFIED'),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('collection_interval_seconds', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('connection_timeout_seconds', sa.Integer(), nullable=False, server_default='15'),
        sa.Column('owner_team_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='SET NULL'), nullable=True),
        sa.Column('tags', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('version_info', sa.String(100), nullable=True),
        sa.Column('last_successful_sync', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_jenkins_servers_name', 'jenkins_servers', ['name'])

    # 9. Jenkins Server Access
    op.create_table(
        'jenkins_server_access',
        sa.Column('server_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jenkins_servers.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=True),
        sa.Column('access_level', sa.String(50), nullable=False, server_default='READ'),
    )

    # 10. Credential References
    op.create_table(
        'credential_references',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('server_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jenkins_servers.id', ondelete='CASCADE'), nullable=False, unique=True),
        sa.Column('auth_type', sa.String(50), nullable=False, server_default='TOKEN'),
        sa.Column('username', sa.String(255), nullable=False),
        sa.Column('encrypted_secret', sa.Text(), nullable=False),
        sa.Column('encryption_key_id', sa.String(50), nullable=False, server_default='default'),
        sa.Column('last_rotated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 11. Jobs
    op.create_table(
        'jobs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('server_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jenkins_servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('full_path', sa.String(500), nullable=False),
        sa.Column('folder', sa.String(255), nullable=True),
        sa.Column('job_type', sa.String(100), nullable=True),
        sa.Column('is_buildable', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('last_build_number', sa.Integer(), nullable=True),
        sa.Column('last_build_result', sa.String(50), nullable=True),
        sa.Column('last_build_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_successful_build_number', sa.Integer(), nullable=True),
        sa.Column('last_failed_build_number', sa.Integer(), nullable=True),
        sa.Column('health_score', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_jobs_server_id', 'jobs', ['server_id'])
    op.create_index('ix_jobs_name', 'jobs', ['name'])

    # 12. Jenkins Job Access
    op.create_table(
        'jenkins_job_access',
        sa.Column('job_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jobs.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=True),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=True),
        sa.Column('can_trigger', sa.Boolean(), nullable=False, server_default='false'),
    )

    # 13. Builds
    op.create_table(
        'builds',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('job_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jobs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('server_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jenkins_servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('build_number', sa.Integer(), nullable=False),
        sa.Column('normalized_status', sa.String(50), nullable=False, server_default='UNKNOWN'),
        sa.Column('jenkins_result', sa.String(50), nullable=True),
        sa.Column('start_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completion_time', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_ms', sa.BigInteger(), nullable=True),
        sa.Column('triggered_by', sa.String(255), nullable=True),
        sa.Column('vcs_branch', sa.String(255), nullable=True),
        sa.Column('vcs_commit', sa.String(100), nullable=True),
        sa.Column('build_url', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('job_id', 'build_number', name='uq_job_build_number'),
    )
    op.create_index('ix_builds_job_id', 'builds', ['job_id'])
    op.create_index('ix_builds_server_id', 'builds', ['server_id'])
    op.create_index('ix_builds_normalized_status', 'builds', ['normalized_status'])
    op.create_index('ix_builds_start_time', 'builds', ['start_time'])

    # 14. Nodes
    op.create_table(
        'nodes',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('server_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jenkins_servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('is_online', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('offline_cause', sa.String(500), nullable=True),
        sa.Column('num_executors', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('busy_executors', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('idle_executors', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('labels', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('server_id', 'name', name='uq_server_node_name'),
    )
    op.create_index('ix_nodes_server_id', 'nodes', ['server_id'])

    # 15. Server Metrics
    op.create_table(
        'server_metrics',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('server_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jenkins_servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('cpu_usage_pct', sa.Float(), nullable=True),
        sa.Column('memory_usage_pct', sa.Float(), nullable=True),
        sa.Column('disk_usage_pct', sa.Float(), nullable=True),
        sa.Column('queue_length', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('active_build_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('available_executors', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('busy_executors', sa.Integer(), nullable=False, server_default='0'),
    )
    op.create_index('ix_server_metrics_server_id', 'server_metrics', ['server_id'])
    op.create_index('ix_server_metrics_recorded_at', 'server_metrics', ['recorded_at'])

    # 16. Collection Runs
    op.create_table(
        'collection_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('server_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jenkins_servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='RUNNING'),
        sa.Column('items_collected', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('error_details', sa.Text(), nullable=True),
    )
    op.create_index('ix_collection_runs_server_id', 'collection_runs', ['server_id'])

    # 17. Alert Rules
    op.create_table(
        'alert_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('rule_type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False, server_default='WARNING'),
        sa.Column('threshold_value', sa.Float(), nullable=True),
        sa.Column('cooldown_minutes', sa.Float(), nullable=False, server_default='15'),
        sa.Column('is_enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )

    # 18. Alerts
    op.create_table(
        'alerts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('rule_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('alert_rules.id', ondelete='SET NULL'), nullable=True),
        sa.Column('server_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jenkins_servers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('alert_type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False, server_default='WARNING'),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=True),
        sa.Column('resource_id', sa.String(255), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='ACTIVE'),
        sa.Column('first_detected_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_observed_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('acknowledged_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('acknowledged_by_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    )
    op.create_index('ix_alerts_server_id', 'alerts', ['server_id'])
    op.create_index('ix_alerts_status', 'alerts', ['status'])
    op.create_index('ix_alerts_severity', 'alerts', ['severity'])

    # 19. Audit Events
    op.create_table(
        'audit_events',
        sa.Column('id', sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column('correlation_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('actor_user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(50), nullable=False),
        sa.Column('resource_id', sa.String(255), nullable=True),
        sa.Column('server_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('jenkins_servers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='SUCCESS'),
        sa.Column('ip_address', sa.String(50), nullable=True),
        sa.Column('user_agent', sa.String(255), nullable=True),
        sa.Column('details', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_audit_events_correlation_id', 'audit_events', ['correlation_id'])
    op.create_index('ix_audit_events_actor_user_id', 'audit_events', ['actor_user_id'])
    op.create_index('ix_audit_events_action', 'audit_events', ['action'])
    op.create_index('ix_audit_events_timestamp', 'audit_events', ['timestamp'])

    # 20. Sessions
    op.create_table(
        'sessions',
        sa.Column('id', sa.String(128), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('ip_address', sa.String(50), nullable=True),
        sa.Column('user_agent', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_sessions_user_id', 'sessions', ['user_id'])
    op.create_index('ix_sessions_expires_at', 'sessions', ['expires_at'])


def downgrade() -> None:
    op.drop_table('sessions')
    op.drop_table('audit_events')
    op.drop_table('alerts')
    op.drop_table('alert_rules')
    op.drop_table('collection_runs')
    op.drop_table('server_metrics')
    op.drop_table('nodes')
    op.drop_table('builds')
    op.drop_table('jenkins_job_access')
    op.drop_table('jobs')
    op.drop_table('credential_references')
    op.drop_table('jenkins_server_access')
    op.drop_table('jenkins_servers')
    op.drop_table('team_members')
    op.drop_table('teams')
    op.drop_table('user_roles')
    op.drop_table('users')
    op.drop_table('role_permissions')
    op.drop_table('roles')
    op.drop_table('permissions')
