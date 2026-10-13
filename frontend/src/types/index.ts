export type ServerStatus =
  | 'ONLINE'
  | 'OFFLINE'
  | 'DEGRADED'
  | 'AUTH_FAILED'
  | 'PERMISSION_DENIED'
  | 'UNVERIFIED'
  | 'DISABLED'
  | 'STALE';

export type BuildStatus =
  | 'RUNNING'
  | 'QUEUED'
  | 'SUCCESS'
  | 'FAILURE'
  | 'UNSTABLE'
  | 'ABORTED'
  | 'NOT_BUILT'
  | 'UNKNOWN';

export interface Role {
  id: string;
  name: string;
  description?: string;
  is_system: boolean;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  status: string;
  is_bootstrap_admin: boolean;
  roles: Role[];
  created_at: string;
  updated_at: string;
}

export interface JenkinsServer {
  id: string;
  name: string;
  base_url: string;
  environment: 'development' | 'staging' | 'production' | 'custom' | string;
  description?: string;
  status: ServerStatus;
  is_enabled: boolean;
  collection_interval_seconds: number;
  connection_timeout_seconds: number;
  version_info?: string;
  last_successful_sync?: string;
  last_error_message?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface MetricSummary {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  degradedServers: number;
  totalJobs: number;
  runningBuilds: number;
  queueLength: number;
  availableExecutors: number;
  failedBuilds24h: number;
  successRate: number;
  openAlerts: number;
}

export interface DashboardSummary {
  total_controllers: number;
  online_controllers: number;
  offline_controllers: number;
  total_jobs: number;
  total_nodes: number;
  online_nodes: number;
  active_builds: number;
  active_alerts: number;
  queue_depth: number;
}

export interface BuildTrendItem {
  date: string;
  success: number;
  failure: number;
  unstable: number;
  aborted: number;
}

export interface Job {
  id: string;
  server_id: string;
  server_name?: string;
  name: string;
  full_path: string;
  job_type?: string;
  is_buildable: boolean;
  last_build_number?: number;
  last_build_result?: string;
  last_build_timestamp?: string;
  last_successful_build_number?: number;
  last_failed_build_number?: number;
  health_score?: number;
  created_at: string;
  updated_at: string;
}

export interface Build {
  id: string;
  job_id: string;
  server_id: string;
  job_name?: string;
  server_name?: string;
  build_number: number;
  normalized_status: BuildStatus | string;
  jenkins_result?: string;
  start_time?: string;
  completion_time?: string;
  duration_ms?: number;
  triggered_by?: string;
  vcs_branch?: string;
  vcs_commit?: string;
  build_url?: string;
  created_at: string;
}

export interface Node {
  id: string;
  server_id: string;
  server_name?: string;
  name: string;
  is_online: boolean;
  offline_cause?: string;
  num_executors: number;
  busy_executors: number;
  idle_executors: number;
  labels: string[];
  last_seen_at: string;
  created_at: string;
}

export interface Alert {
  id: string;
  server_id: string;
  server_name?: string;
  alert_type: string;
  severity: 'WARNING' | 'CRITICAL' | string;
  title: string;
  description: string;
  resource_type?: string;
  resource_id?: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | string;
  first_detected_at: string;
  last_observed_at: string;
  resolved_at?: string;
  acknowledged_at?: string;
}

export interface AuditEvent {
  id: number;
  correlation_id: string;
  actor_user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  server_id?: string;
  status: string;
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
  timestamp: string;
}

