from celery import Celery
from celery.signals import worker_process_init




from app.config import settings
from app.observability import setup_worker_observability

celery_app = Celery(
    'saabi',
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
)


@worker_process_init.connect
def _init_observability(**_kwargs):
    setup_worker_observability()
