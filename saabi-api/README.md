# SAABI API

This is the backend service for SAABI. It exposes a FastAPI application that
handles user registration, wallet management, and payment orchestration on top
of Nomba's payout, checkout and virtual-account APIs. Users interact with the system over
WhatsApp; the API is the single source of truth for wallets, transactions, and
funding state.

For first-time setup, see [docs/setup_guide.md](docs/setup_guide.md). This
document covers the architecture and the moving parts.

## Docker

The service is developed and run entirely inside containers. Docker gives us a
reproducible runtime so the API, worker, database, and cache all behave the
same on every machine, without anyone installing Postgres or Redis locally.

Docker Compose defines the application services:

- `api` — the FastAPI app, built from the local `Dockerfile` (`python:alpine3.22`),
  served by `uvicorn` with `--reload` for live code updates.
- `worker` — a Celery worker built from the same image, for background tasks.
- `database` — `postgres:18`, exposed on host port `5433`.
- `redis` — `redis:7-alpine`, the Celery broker and result backend.

It also runs a local observability stack (`prometheus`, `loki`, `promtail`,
`tempo`, `grafana`) — see [Observability](#observability) below.

The `api` and `worker` containers mount the project directory as a volume, so
edits on the host are picked up without a rebuild.

To get started quickly:

```bash
cp .env.sample .env        # fill in secrets before the first run
docker compose up -d --build
docker compose logs -f api
```

Rebuild only the API container after dependency changes:

```bash
docker compose up api -d --build
```

Tear everything down:

```bash
docker compose down
```

## Twilio and WhatsApp

WhatsApp is the entire user-facing surface for payments. Inbound messages are
delivered by Twilio to `POST /webhooks/twilio/whatsapp`, which drives a
two-step conversation (intent, then PCT confirmation). Twilio is also used to
send OTPs during registration. In production, inbound webhooks are verified
against Twilio's request signature; `TWILIO_DEMO_MODE=true` bypasses that check
so local Bruno calls can exercise the flow.

## Observability

`docker compose up` also starts a full local telemetry stack. Once it's up,
open Grafana at **http://localhost:3000** (anonymous admin access is enabled —
no login needed). The pre-provisioned **SAABI API — Overview** dashboard shows
request rates, latency percentiles, status codes, and live logs.

What gets collected:

- **Metrics** — `prometheus-fastapi-instrumentator` exposes `/metrics` on the
  API (request counts, latency histograms, sizes). `prometheus` scrapes it
  every 15s and Grafana reads from it.
- **Logs** — `promtail` tails every container's stdout/stderr via the Docker
  socket and ships it to `loki`. Query them in Grafana's Explore view or the
  logs panel on the dashboard, e.g. `{container="saabi-api"}`.
- **Traces** — the API and Celery worker are instrumented with OpenTelemetry
  (FastAPI, SQLAlchemy, Redis, httpx, requests, Celery). Spans are exported
  over OTLP gRPC to `tempo`. Trace and span IDs are also injected into log
  lines, so logs and traces cross-link in Grafana.

Ports: Grafana `3000`, Prometheus `9090`, Loki `3100`, Tempo `3200`, OTLP
ingest `4317`.

Tracing is controlled by the `OTEL_*` variables in `.env`. Set
`OTEL_ENABLED=false` to run the app without exporting traces (useful when
running the API outside compose, where `tempo` isn't reachable). The configs
for each component live under `observability/`.

## Tech Stack

The service is Python 3, built around the following libraries:

- `fastapi` / `uvicorn` — the web framework and ASGI server.
- `pydantic` / `pydantic-settings` — request/response schemas and typed,
  environment-driven configuration (`app/config.py`).
- `sqlalchemy` — ORM and data layer, using the typed `Mapped` style.
- `alembic` — database schema migrations.
- `psycopg` — the Postgres driver.
- `celery` with `redis` — background task queue and broker.
- `httpx` — async HTTP client for calling Nomba's API.
- `google-genai` — Gemini client for fuzzy WhatsApp intent classification and
  field extraction (amounts and account numbers stay on regex).
- `twilio` — WhatsApp messaging, OTP delivery, and webhook signature validation.

## Environment Setup

`.env` files are git ignored. After a fresh clone, create one from the sample:

```bash
cp .env.sample .env
```

Then fill in the blanks. The variables fall into a few groups:

- `DATABASE_*` — Postgres connection details. These must match the values the
  `database` service is started with in `docker-compose.yaml`.
- `DB_POOL_*` — SQLAlchemy connection pool tuning. The defaults are fine for
  development.
- `REDIS_URL` — Celery broker URL; defaults to the `redis` service.
- `NOMBA_CLIENT_ID`, `NOMBA_CLIENT_SECRET`, `NOMBA_ACCOUNT_ID`, `NOMBA_BASE_URL`,
  `NOMBA_WEBHOOK_SECRET` — Nomba credentials. `NOMBA_BASE_URL` defaults to the
  sandbox; `NOMBA_ACCOUNT_ID` (the parent business account UUID) is sent as a
  header on every call, and `NOMBA_WEBHOOK_SECRET` verifies inbound webhook
  signatures.
- `GEMINI_API_KEY`, `GEMINI_MODEL` — Google Gemini for WhatsApp intent parsing.
  Optional: with no key the bot falls back to regex-only intent detection.
- `TWILIO_*` — Twilio account credentials, the verify service SID, and the
  sender/WhatsApp numbers. Set `TWILIO_DEMO_MODE=false` to enforce inbound
  webhook signature validation.

If you add a new setting, declare it on the `Settings` model in
`app/config.py` and add a matching entry to `.env.sample` so the next person
knows it exists.

## Alembic and SQLAlchemy

The database schema is defined by SQLAlchemy models under `app/models/`, and
every model is registered in `app/models/__init__.py` so Alembic can see it.
Schema changes are tracked as Alembic revisions in `alembic/versions/`, each
one chained to its predecessor by `down_revision`.

Migrations are run from inside the `api` container:

```bash
docker compose exec api sh

# generate a revision from model changes
alembic revision --autogenerate -m "<change description>"

# apply migrations up to the latest revision
alembic upgrade head
```

Always review an autogenerated revision before committing it — Alembic's diff
is a starting point, not the final word, and index or constraint changes in
particular often need a manual pass.
