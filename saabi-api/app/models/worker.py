from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql.functions import func
from sqlalchemy.sql.schema import ForeignKey
from sqlalchemy import Index, Float

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Worker(Base):
    """Service provider / informal trader profile for discovery."""

    __tablename__ = 'workers'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    # Link to user account (optional - can register without full auth)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey('users.id'), nullable=True, unique=True)
    user: Mapped[Optional['User']] = relationship(back_populates='worker_profile')

    # Public profile
    full_name: Mapped[str]
    phone_number: Mapped[str] = mapped_column(unique=True)
    email: Mapped[Optional[str]]

    # Service details
    service_category: Mapped[str]  # e.g. "Plumbing", "Food Delivery", "Electrician"
    service_description: Mapped[Optional[str]]
    base_rate: Mapped[Optional[str]]  # e.g. "₦5,000/hr"

    # Location
    lga: Mapped[str]  # Local Government Area
    state: Mapped[str] = mapped_column(default='Lagos')
    geo_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    geo_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Verification & trust
    is_verified: Mapped[bool] = mapped_column(default=False)
    credibility_score: Mapped[float] = mapped_column(default=0.0)
    rating: Mapped[float] = mapped_column(default=5.0)
    review_count: Mapped[int] = mapped_column(default=0)

    # Availability
    is_available: Mapped[bool] = mapped_column(default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('ix_workers_service_lga', 'service_category', 'lga'),
        Index('ix_workers_location', 'geo_lat', 'geo_lng'),
        Index('ix_workers_rating', 'rating'),
    )