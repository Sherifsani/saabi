from __future__ import annotations

import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql.functions import func
from sqlalchemy.sql.schema import ForeignKey

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class FundingStatus(str, enum.Enum):
    # We create the row PENDING before opening Squad's modal, then flip it
    # once Squad's collection webhook tells us how the charge resolved.
    PENDING = 'PENDING'
    SUCCESS = 'SUCCESS'
    FAILED = 'FAILED'


class WalletFunding(Base):
    """A single wallet top-up attempt via Squad's payment (collection) modal.

    This is deliberately *not* a ``Transaction`` — that table models outbound
    transfers (sender → recipient). A funding event is an inbound credit, so
    it gets its own table rather than nullable recipient columns.
    """

    __tablename__ = 'wallet_fundings'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'), index=True)
    user: Mapped['User'] = relationship(back_populates='wallet_fundings')

    # Our own reference, generated at init time and handed to the Squad modal.
    # The webhook reconciles against this.
    reference: Mapped[str] = mapped_column(unique=True, index=True)
    # Squad's transaction reference, only known once the webhook arrives.
    squad_transaction_ref: Mapped[Optional[str]] = mapped_column(default=None)

    amount: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=2))
    currency: Mapped[str] = mapped_column(default='NGN')

    status: Mapped[str] = mapped_column(default=FundingStatus.PENDING.value, index=True)
    failure_reason: Mapped[Optional[str]] = mapped_column(default=None)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(default=None)
