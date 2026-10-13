# Jenkins Control Center

An enterprise-grade, centralized management platform designed to monitor, administer, and orchestrate multiple independent Jenkins controllers from a single pane of glass.

---

## 1. Architecture Overview

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide icons, TanStack Query, and Recharts.
- **Backend API**: Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Psycopg 3.
- **Asynchronous Engine**: Celery 5.x, Redis 7 (task broker and cache).
- **Relational Store**: PostgreSQL 16 with normalized multi-controller schemas and idempotent constraints.
- **Security Boundary**: Zero direct browser-to-Jenkins network traffic. Centralized backend proxying with authenticated credential encryption (AES-256-Fernet) and strict SSRF defenses.

---

## 2. Directory Structure

```text
jenkins-control-center/
├── compose.yaml              # Docker Compose multi-service definition
├── .env.example              # Sample environment configuration
├── .gitignore
├── README.md
├── frontend/
│   ├── src/
│   │   ├── components/       # MetricCard, StatusBadge, Sidebar, Topbar
│   │   ├── layouts/          # ApplicationLayout
│   │   ├── pages/            # 11 enterprise views (Overview, Servers, Nodes, Jobs, ...)
│   │   ├── types/            # TypeScript interfaces
│   │   └── App.tsx           # Route hierarchy
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
└── backend/
    ├── app/
    │   ├── main.py           # FastAPI entry point & CORS
    │   ├── config.py         # Pydantic BaseSettings
    │   ├── api/v1/health.py  # /live and /ready probes
    │   ├── core/             # Logging, security, SSRF guards
    │   ├── db/               # SQLAlchemy engine, session maker, base
    │   └── models/           # 20 normalized ORM tables
    ├── migrations/           # Alembic database migrations
    ├── tests/                # Automated pytest suite
    ├── requirements.txt
    └── Dockerfile
```

---

## 3. Quickstart & Deployment

### Option A: Using Docker Compose (Recommended)

1. **Clone and enter repository**:
   ```bash
   cd jenkins-control-center
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

3. **Start services**:
   ```bash
   docker compose up -d --build
   ```

4. **Verify running containers**:
   ```bash
   docker compose ps
   ```

5. **Access the platform**:
   - **Web UI**: [http://localhost:3000](http://localhost:3000)
   - **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Liveness Probe**: [http://localhost:8000/api/v1/health/live](http://localhost:8000/api/v1/health/live)
   - **Readiness Probe**: [http://localhost:8000/api/v1/health/ready](http://localhost:8000/api/v1/health/ready)

---

### Option B: Local Development Mode

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 4. Automated Testing

Run the backend automated test suite:
```bash
cd backend
pytest -v
```

Run frontend type checking and production build:
```bash
cd frontend
npm run build
```

---

## 5. Security & SSRF Protection

- **SSRF Defense**: The backend verifies destination hostnames against an IP blocklist rejecting loopback (`127.0.0.0/8`), private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and cloud metadata (`169.254.169.254`) before dispatching requests.
- **Write-Only Secrets**: Jenkins API tokens are encrypted in the database using Fernet and never transmitted back to the client.
- **Default-Deny RBAC**: Every controller query is scoped by team/server access assignments.
