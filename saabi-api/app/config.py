from functools import lru_cache

from pydantic import Field
from pydantic.fields import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _with_psycopg_driver(dsn: str) -> str:
    """Force the SQLAlchemy psycopg3 driver, preserving DSN query params."""
    if dsn.startswith('postgresql+'):
        return dsn
    if dsn.startswith('postgresql://'):
        return 'postgresql+psycopg://' + dsn[len('postgresql://'):]
    if dsn.startswith('postgres://'):
        return 'postgresql+psycopg://' + dsn[len('postgres://'):]
    return dsn


class Settings(BaseSettings):

    app_name: str = "SAABI API"
    debug: bool = False
    database_host: str = ''
    database_port: int = 5432
    database_password: str = ''
    database_user: str = ''
    database_name: str = ''

    # Optional full DSN (e.g. a Neon/hosted Postgres URL). When set it takes
    # precedence over the component vars above and is used verbatim, so it can
    # carry query params the component build can't — notably Neon's
    # ``sslmode=require`` / ``channel_binding=require``.
    database_dsn: str = Field(default='', validation_alias='DATABASE_URL')

    db_pool_size: int = 60
    db_max_overflow: int = 20
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800

    redis_url: str = 'redis://redis:6379/0'

    # Nomba API credentials (OAuth2 client-credentials). The webhook secret is
    # the signing key configured in the Nomba dashboard's webhook settings.
    # ``nomba_account_id`` is the PARENT business account UUID sent in the
    # accountId header; ``nomba_subaccount_id`` scopes calls to our sub-account.
    nomba_client_id: str
    nomba_client_secret: str
    nomba_account_id: str
    nomba_subaccount_id: str = ''
    nomba_base_url: str = 'https://sandbox.nomba.com'
    nomba_webhook_secret: str

    # Google Gemini — fuzzy intent classification + field extraction only.
    gemini_api_key: str = ''
    gemini_model: str = 'gemini-2.0-flash'

    twilio_account_sid: str
    twilio_auth_token: str
    twilio_verify_service_sid: str
    twilio_from_number: str
    twilio_whatsapp_number: str
    twilio_join_code: str
    twilio_demo_mode: bool
    # OTP delivery channel for Twilio Verify: 'sms' or 'whatsapp'. SMS works out
    # of the box; 'whatsapp' requires a WhatsApp sender enabled on the Verify
    # service (the Messaging sandbox number does NOT provide this).
    twilio_otp_channel: str = 'sms'

    otel_enabled: bool = True
    otel_service_name: str = 'saabi-api'
    otel_exporter_otlp_endpoint: str = 'http://tempo:4317'

    # Security
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    model_config = SettingsConfigDict(env_file='.env')

    @computed_field
    @property
    def database_url(self) -> str:
        if self.database_dsn:
            return _with_psycopg_driver(self.database_dsn)
        return (
            f'postgresql+psycopg://{self.database_user}:{self.database_password}'
            f'@{self.database_host}:{self.database_port}/{self.database_name}'
        )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()