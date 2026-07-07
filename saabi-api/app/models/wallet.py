from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql.functions import func
from sqlalchemy.sql.schema import ForeignKey

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Wallet(Base):
    __tablename__ = 'wallets'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey('users.id'), unique=True)
    user: Mapped['User'] = relationship(back_populates='wallet')

    balance: Mapped[Decimal] = mapped_column(Numeric(precision=18, scale=2), default=Decimal('0.00'))
    currency: Mapped[str] = mapped_column(default='NGN')

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
