# Jenkins Control Center — REST API Reference

The Jenkins Control Center backend provides a versioned REST API mounted under the `/api/v1` prefix. Interactive OpenAPI documentation is accessible at `/docs` (Swagger UI) and `/redoc` (ReDoc).

---

## 1. Authentication & Session Management (`/api/v1/auth`)

### `POST /api/v1/auth/login`
Authenticates user credentials, sets secure session cookies, and returns user profile data.

- **Request Body**:
  ```json
  {
    "email": "admin@company.local",
    "password": "Admin12345!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "id": "e9a03b57-61b8-4c91-9e77-cfb5b03f0b24",
    "email": "admin@company.local",
    "display_name": "Platform Administrator",
    "status": "ACTIVE",
    "is_bootstrap_admin": true,
    "roles": ["Platform Administrator"],
    "permissions": [],
    "session_token": "jcc_sess_a8b9c0d1e2f3..."
  }
  ```

### `POST /api/v1/auth/logout`
Revokes the active session token in the database and clears authentication cookies.

- **Response (200 OK)**:
  ```json
  {
    "message": "Logged out successfully."
  }
  ```

### `GET /api/v1/auth/me`
Retrieves the user profile and assigned roles for the currently authenticated session.

### `POST /api/v1/auth/change-password`
Updates the password for the current user. Requires the current password.

---

## 2. Health & Telemetry Probes (`/api/v1/health`)

### `GET /api/v1/health/live`
Kubernetes/Docker liveness probe. Returns HTTP 200 if the process is responsive.

- **Response (200 OK)**:
  ```json
  {
    "status": "alive",
    "timestamp": "2026-11-11T06:45:00Z"
  }
  ```

### `GET /api/v1/health/ready`
Readiness probe verifying connectivity to PostgreSQL and Redis.

- **Response (200 OK)**:
  ```json
  {
    "status": "ready",
    "database": "connected",
    "redis": "connected",
    "timestamp": "2026-11-11T06:45:00Z"
  }
  ```

---

## 3. Jenkins Controller Management (`/api/v1/servers`)

### `GET /api/v1/servers`
Lists all registered Jenkins controllers with status, version, and sync timestamps.

### `POST /api/v1/servers`
Registers a new Jenkins controller. Performs an upfront connection test and encrypts secrets write-only.

- **Request Body**:
  ```json
  {
    "name": "Production Controller EU",
    "base_url": "https://jenkins-prod.company.com",
    "environment": "production",
    "description": "Primary release pipeline cluster",
    "auth_type": "TOKEN",
    "username": "svc-jenkins-admin",
    "secret_token": "11a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7",
    "collection_interval_seconds": 60,
    "connection_timeout_seconds": 15,
    "tags": ["production", "eu-central"]
  }
  ```

### `POST /api/v1/servers/test-connection`
Tests connectivity and credentials against a Jenkins controller before registering. Protected by SSRF validation.

- **Response (200 OK)**:
  ```json
  {
    "online": true,
    "status": "ONLINE",
    "version": "2.440.3",
    "message": "Successfully connected to Jenkins v2.440.3",
    "description": "Enterprise Release Node"
  }
  ```

### `POST /api/v1/servers/{server_id}/sync`
Triggers an immediate on-demand background data ingestion task for the controller.

### `DELETE /api/v1/servers/{server_id}`
Deletes the server registration, encrypted credentials, and associated telemetry data.

---

## 4. Jobs & Build Execution (`/api/v1/jobs`)

### `GET /api/v1/jobs`
Lists CI/CD jobs across all registered controllers, with optional filtering.

- **Query Parameters**:
  - `server_id`: (UUID, optional) Filter by Jenkins controller.
  - `q`: (string, optional) Case-insensitive search on job name.
  - `limit`: (int, default 100) Pagination limit.
  - `offset`: (int, default 0) Pagination offset.

### `GET /api/v1/jobs/{job_id}/builds`
Retrieves historical build execution runs for a specific job.

### `POST /api/v1/jobs/{job_id}/build`
Proxies a build trigger request to the upstream Jenkins controller with automatic CSRF crumb acquisition and audit logging.

- **Response (200 OK)**:
  ```json
  {
    "status": "queued",
    "message": "Successfully requested build trigger for api-service-pipeline",
    "job_id": "8c4f923b-741a-42c2-870b-482a5d3f231a"
  }
  ```

---

## 5. Build Runs & Live Logs (`/api/v1/builds`)

### `GET /api/v1/builds`
Lists historical and active build executions across all controllers.

- **Query Parameters**:
  - `server_id`: (UUID, optional) Filter by controller.
  - `status`: (string, optional) Filter by `SUCCESS`, `FAILURE`, `RUNNING`, `UNSTABLE`, `ABORTED`.
  - `limit`: (int, default 50) Pagination limit.

### `GET /api/v1/builds/{build_id}/console`
Proxies the raw console text output from the upstream Jenkins controller for inspection in modal dialogs.

- **Response (200 OK)**:
  ```json
  {
    "build_id": "9b1c2d3e-4f5a-6b7c-8d9e-0f1a2b3c4d5e",
    "job_name": "frontend-portal-release",
    "build_number": 142,
    "log_content": "Started by user admin\nRunning in Durability level: MAX_SURVIVABILITY\n[Pipeline] Start of Pipeline\n...\nFinished: SUCCESS"
  }
  ```

---

## 6. Build Agents & Executors (`/api/v1/nodes`)

### `GET /api/v1/nodes`
Lists all agent nodes across controllers, reporting executor distribution, idle status, assigned labels, and offline cause reasons.

- **Response (200 OK)**:
  ```json
  [
    {
      "id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
      "server_id": "e9a03b57-61b8-4c91-9e77-cfb5b03f0b24",
      "server_name": "Production Controller EU",
      "name": "builder-node-agent-01",
      "is_online": true,
      "offline_cause": null,
      "num_executors": 4,
      "busy_executors": 1,
      "idle_executors": 3,
      "labels": ["docker", "linux", "x86_64"],
      "last_seen_at": "2026-11-11T06:45:00Z"
    }
  ]
  ```

---

## 7. Operational Incident Alerts (`/api/v1/alerts`)

### `GET /api/v1/alerts`
Lists system alerts with optional filtering by status (`ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`) and severity (`WARNING`, `CRITICAL`).

### `PATCH /api/v1/alerts/{alert_id}/acknowledge`
Marks an active alert as acknowledged by the current operator.

### `PATCH /api/v1/alerts/{alert_id}/resolve`
Marks an alert as resolved and records the resolution timestamp in the audit trail.

---

## 8. Fleet Overview & Trends (`/api/v1/dashboard`)

### `GET /api/v1/dashboard/summary`
Returns aggregate platform-wide telemetry:
- `total_controllers`, `online_controllers`, `offline_controllers`
- `total_jobs`, `total_nodes`, `online_nodes`
- `active_builds`, `active_alerts`, `queue_depth`

### `GET /api/v1/dashboard/build-trends`
Returns daily aggregated build counts grouped by status over the requested window (default: 7 days) for area chart visualizations.

---

## 9. User Administration & RBAC (`/api/v1/users`)

### `GET /api/v1/users`
Lists all platform users and their assigned roles.

### `POST /api/v1/users`
Creates a new platform user with Argon2id password hashing.

### `GET /api/v1/roles`
Lists system roles (`Platform Administrator`, `Developer`, `Auditor`, `Operator`).
