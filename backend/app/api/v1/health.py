from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.config import settings
import redis

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/live", status_code=status.HTTP_200_OK)
def liveness() -> dict:
    """Liveness probe: verifies the API process is alive and responsive."""
    return {"status": "ok", "service": settings.APP_NAME}


@router.get("/ready")
def readiness(response: Response, db: Session = Depends(get_db)) -> dict:
    """Readiness probe: verifies PostgreSQL and Redis connections."""
    checks = {
        "database": "unknown",
        "redis": "unknown",
    }
    healthy = True

    # Check PostgreSQL
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)}"
        healthy = False

    # Check Redis
    try:
        r = redis.from_url(settings.REDIS_URL, socket_timeout=2.0)
        if r.ping():
            checks["redis"] = "healthy"
        else:
            checks["redis"] = "unhealthy: ping returned false"
            healthy = False
    except Exception as e:
        checks["redis"] = f"unhealthy: {str(e)}"
        healthy = False

    if not healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return {
        "status": "ready" if healthy else "not_ready",
        "checks": checks,
    }
