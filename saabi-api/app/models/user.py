from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy.orm import mapped_column, relationship
from sqlalchemy.orm.attributes import Mapped
from sqlalchemy.sql.functions import func

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.payment_confirmation_token import PaymentConfirmationToken
    from app.models.profile import Profile
    from app.models.transaction import Transaction
    from app.models.wallet import Wallet
    from app.models.wallet_funding import WalletFunding
    from app.models.worker import Worker


class User(Base):
    __tablename__ = 'users'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    profile: Mapped[Optional['Profile']] = relationship(back_populates='user', uselist=False)
    wallet: Mapped[Optional['Wallet']] = relationship(back_populates='user', uselist=False)
    payment_confirmation_token: Mapped[Optional['PaymentConfirmationToken']] = relationship(
        back_populates='user', uselist=False
    )
    transactions: Mapped[list['Transaction']] = relationship(back_populates='sender')
    wallet_fundings: Mapped[list['WalletFunding']] = relationship(back_populates='user')
    worker_profile: Mapped[Optional['Worker']] = relationship(back_populates='user', uselist=False)

    phone_number: Mapped[str] = mapped_column(unique=True)
    first_name: Mapped[str]
    last_name: Mapped[str]
    email: Mapped[str]
    date_of_birth: Mapped[str]
    address: Mapped[str]
    gender: Mapped[str]

    account_verified: Mapped[bool] = mapped_column(default=False, nullable=True)
    phone_verified: Mapped[bool] = mapped_column(default=False)

    account_number: Mapped[str]
    bank_code: Mapped[str]

    # Static Nomba virtual account for in-chat wallet funding. Populated the
    # first time the user funds (or at verification); null until then.
    virtual_account_number: Mapped[Optional[str]] = mapped_column(default=None, unique=True)

    geo_lat: Mapped[float]
    geo_lng: Mapped[float]

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())
