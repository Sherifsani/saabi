import logging

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.celery import CeleryInstrumentor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from app.config import settings

logger = logging.getLogger('uvicorn.error')

_LOG_FORMAT = (
    '%(asctime)s %(levelname)-5s [%(name)s] '
    '[trace=%(otelTraceID)s span=%(otelSpanID)s] %(message)s'
)

_provider_ready = False
_shared_done = False


def _init_tracer_provider() -> bool:
    global _provider_ready
    if _provider_ready:
        return True
    if not settings.otel_enabled:
        logger.info('OpenTelemetry disabled (OTEL_ENABLED=false)')
        return False

    resource = Resource.create({SERVICE_NAME: settings.otel_service_name})
    provider = TracerProvider(resource=resource)
    provider.add_span_processor(
        BatchSpanProcessor(
            OTLPSpanExporter(
                endpoint=settings.otel_exporter_otlp_endpoint,
                insecure=True,
            )
        )
    )
    trace.set_tracer_provider(provider)
    _provider_ready = True
    logger.info(
        'OpenTelemetry tracing enabled -> %s', settings.otel_exporter_otlp_endpoint
    )
    return True


def _instrument_shared() -> None:
    global _shared_done
    if _shared_done:
        return
    # Inject trace/span IDs into log records, then surface them in the log format.
    # `defaults` keeps the formatter safe for records created before instrumentation
    # (or by code paths that bypass OTel's log record factory).
    LoggingInstrumentor().instrument(set_logging_format=False)
    formatter = logging.Formatter(
        _LOG_FORMAT, defaults={'otelTraceID': '-', 'otelSpanID': '-'}
    )
    for handler in logging.getLogger().handlers:
        handler.setFormatter(formatter)

    from app.database import engine

    SQLAlchemyInstrumentor().instrument(engine=engine)
    RedisInstrumentor().instrument()
    HTTPXClientInstrumentor().instrument()
    RequestsInstrumentor().instrument()
    _shared_done = True


def setup_api_observability(app) -> None:
    """Instrument the FastAPI app: traces for requests, DB, Redis, outbound HTTP."""
    if not _init_tracer_provider():
        return
    FastAPIInstrumentor.instrument_app(app)
    _instrument_shared()


def setup_worker_observability() -> None:
    """Instrument the Celery worker. Call once per worker process."""
    if not _init_tracer_provider():
        return
    CeleryInstrumentor().instrument()
    _instrument_shared()
