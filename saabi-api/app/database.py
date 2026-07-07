from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings

engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def load_database():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Alias for routers that expect the ``get_db`` name.
get_db = load_database
