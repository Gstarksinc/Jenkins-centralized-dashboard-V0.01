from celery import Celery
from app.config import settings

celery = Celery(
    "jenkins_control_center",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)


@celery.task(name="app.workers.tasks_sync.ping_task")
def ping_task():
    return {"status": "pong"}
