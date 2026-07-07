from __future__ import annotations

import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Index, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql.functions import func
from sqlalchemy.sql.schema import ForeignKey

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class TransactionStatus(str, enum.Enum):
    AWAITING_CONFIRMATION = 'AWAITING_CONFIRMATION'
    PROCESSING = 'PROCESSING'
    SUCCESS = 'SUCCESS'
    FAILED = 'FAILED'
    REJECTED = 'REJECTED'
    EXPIRED = 'EXPIRED'
    CANCELLED = 'CANCELLED'


TERMINAL_STATUSES = frozenset(
    {
        TransactionStatus.SUCCESS,
        TransactionStatus.FAILED,
        TransactionStatus.REJECTED,
        TransactionStatus.EXPIRED,
        TransactionStatus.CANCELLED,
    }
)


class Transaction(Base):
    __tablename__ = 'transactions'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    sender_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'), index=True)
    sender: Mapped['User'] = relationship(back_populates='transactions')

    reference: Mapped[str] = mapped_column(unique=True, index=True)
    squad_reference: Mapped[Optional[str]] = mapped_column(default=None)

    recipient_account_number: Mapped[str]
    recipient_bank_code: Mapped[str]
    recipient_bank_name: Mapped[str]
    recipient_account_name: Mapped[str]

    amount: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=2))
    fee: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=2), default=Decimal('0.00'))
    currency: Mapped[str] = mapped_column(default='NGN')

    status: Mapped[str] = mapped_column(default=TransactionStatus.AWAITING_CONFIRMATION.value, index=True)
    failure_reason: Mapped[Optional[str]] = mapped_column(default=None)

    narration: Mapped[str] = mapped_column(default='SAABI WhatsApp transfer')
    raw_message: Mapped[Optional[str]] = mapped_column(default=None)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
    expires_at: Mapped[datetime]
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(default=None)

    __table_args__ = (Index('ix_transactions_sender_status', 'sender_id', 'status'),)
