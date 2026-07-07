"""
Lightweight fraud screening for outbound transfers.

Checks executed before a transaction is allowed to enter
AWAITING_CONFIRMATION, and re-checked at PCT confirmation time. Designed to
be fast (single DB query) and conservative; a real deployment would add
behavioural scoring, device fingerprinting and recipient reputation.
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.models.transaction import Transaction, TransactionStatus
from app.models.user import User

# Per-transaction ceiling. Higher amounts would need a separate review path
# we have not built yet, so we hard-fail rather than silently approve.
SINGLE_TX_MAX = Decimal('500000.00')

# Rolling-window velocity limits.
HOURLY_TX_COUNT_MAX = 10
DAILY_TX_COUNT_MAX = 50
DAILY_AMOUNT_MAX = Decimal('1000000.00')


@dataclass
class FraudDecision:
    approved: bool
    reason: Optional[str] = None


def screen(
    db: Session,
    user: User,
    amount: Decimal,
    recipient_account_number: str,
) -> FraudDecision:
    if amount <= 0:
        return FraudDecision(False, 'Amount must be greater than zero.')

    if amount > SINGLE_TX_MAX:
        return FraudDecision(False, f'Amount exceeds the per-transaction limit of NGN {SINGLE_TX_MAX:,}.')

    if recipient_account_number == user.account_number:
        return FraudDecision(False, 'You cannot send money to your own registered account.')

    now = datetime.now(timezone.utc)
    hour_ago = now - timedelta(hours=1)
    day_ago = now - timedelta(days=1)

    counted_statuses = (
        TransactionStatus.AWAITING_CONFIRMATION.value,
        TransactionStatus.PROCESSING.value,
        TransactionStatus.SUCCESS.value,
    )

    hourly_count = _count_recent(db, user.id, hour_ago, counted_statuses)
    if hourly_count >= HOURLY_TX_COUNT_MAX:
        return FraudDecision(False, 'Hourly transaction limit reached. Try again later.')

    daily_count = _count_recent(db, user.id, day_ago, counted_statuses)
    if daily_count >= DAILY_TX_COUNT_MAX:
        return FraudDecision(False, 'Daily transaction limit reached. Try again tomorrow.')

    daily_sum = _sum_recent(db, user.id, day_ago, counted_statuses)
    if daily_sum + amount > DAILY_AMOUNT_MAX:
        return FraudDecision(False, f'This would exceed your daily spend limit of NGN {DAILY_AMOUNT_MAX:,}.')

    return FraudDecision(True)


def _count_recent(
    db: Session,
    user_id: uuid.UUID,
    since: datetime,
    statuses: tuple[str, ...],
) -> int:
    return (
        db.query(func.count(Transaction.id))
        .filter(
            and_(
                Transaction.sender_id == user_id,
                Transaction.created_at >= since,
                Transaction.status.in_(statuses),
            )
        )
        .scalar()
        or 0
    )


def _sum_recent(
    db: Session,
    user_id: uuid.UUID,
    since: datetime,
    statuses: tuple[str, ...],
) -> Decimal:
    total = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            and_(
                Transaction.sender_id == user_id,
                Transaction.created_at >= since,
                Transaction.status.in_(statuses),
            )
        )
        .scalar()
    )
    return Decimal(total or 0)
