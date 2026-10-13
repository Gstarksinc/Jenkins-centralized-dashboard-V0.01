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

export interface JenkinsServer {
  id: string;
  name: string;
  base_url: string;
  environment: 'development' | 'staging' | 'production' | 'custom';
  description?: string;
  status: ServerStatus;
  is_enabled: boolean;
  collection_interval_seconds: number;
  connection_timeout_seconds: number;
  version_info?: string;
  last_successful_sync?: string;
  last_error_message?: string;
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
