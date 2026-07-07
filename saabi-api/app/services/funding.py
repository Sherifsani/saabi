"""
Wallet funding: crediting a user's internal wallet from Squad's payment modal.

The flow has two halves:

* :func:`initiate` — called by ``POST /wallet/fund/init``. Records a PENDING
  ``WalletFunding`` row and hands its reference back to the frontend, which
  opens Squad's checkout modal with it.

* :func:`apply_charge_status` — called by Squad's collection webhook once the
  user pays. It reconciles the row by reference and, on success, credits the
  wallet exactly once.

Crediting only happens here, never from the init call — we never trust a
balance change that Squad hasn't confirmed.
"""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.wallet import Wallet
from app.models.wallet_funding import FundingStatus, WalletFunding
from app.services import nomba

logger = logging.getLogger(__name__)

_SUCCESS_STATUSES = {'success', 'successful'}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _generate_reference() -> str:
    # Collection references are freeform; a readable prefix just makes them
    # easy to spot in logs and the Nomba dashboard.
    return f'FUND_{secrets.token_hex(8)}'


async def ensure_virtual_account(db: Session, user: User) -> str:
    """Return the user's static Nomba virtual account number, creating it once.

    Any bank transfer into this number triggers a Nomba ``payment_success``
    webhook that credits the wallet (see :func:`credit_from_virtual_account`).
    """
    if user.virtual_account_number:
        return user.virtual_account_number

    # accountRef must be 16-64 chars; accountName 8-64. Derive a stable ref
    # from the user id and pad the display name if it is too short.
    account_ref = f'SAABI-{user.id.hex}'
    account_name = f'{user.first_name} {user.last_name}'.strip()
    if len(account_name) < 8:
        account_name = f'{account_name} SAABI'.strip()

    info = await nomba.create_virtual_account(account_ref=account_ref, account_name=account_name)
    user.virtual_account_number = info['account_number']
    db.commit()
    logger.info('Created virtual account %s for user %s', info['account_number'], user.id)
    return info['account_number']


def initiate(db: Session, user: User, amount: Decimal) -> WalletFunding:
    """Record a pending funding attempt and return it for the Squad modal."""
    funding = WalletFunding(
        user_id=user.id,
        reference=_generate_reference(),
        amount=amount,
        currency='NGN',
        status=FundingStatus.PENDING.value,
    )
    db.add(funding)
    db.commit()
    db.refresh(funding)
    return funding


def apply_charge_status(
    db: Session,
    reference: str,
    status: str,
    squad_transaction_ref: str | None = None,
    message: str | None = None,
) -> WalletFunding | None:
    """Reconcile a Squad collection webhook against a pending funding row.

    Returns the funding row, or ``None`` if the reference is unknown to us.
    Safe to call repeatedly — Squad retries webhooks, so a row that has
    already been settled is left untouched.
    """
    funding: WalletFunding | None = (
        db.query(WalletFunding).filter(WalletFunding.reference == reference).first()
    )
    if funding is None:
        return None

    if funding.status != FundingStatus.PENDING.value:
        logger.info('Funding webhook for %s: already %s — ignoring.', reference, funding.status)
        return funding

    if squad_transaction_ref:
        funding.squad_transaction_ref = squad_transaction_ref

    if (status or '').lower() not in _SUCCESS_STATUSES:
        funding.status = FundingStatus.FAILED.value
        funding.failure_reason = message or f'Squad reported {status}'
        db.commit()
        logger.info('Funding %s failed: %s', reference, funding.failure_reason)
        return funding

    # Lock the wallet row so two overlapping webhook deliveries can't both
    # read the old balance and double-credit.
    wallet: Wallet | None = (
        db.query(Wallet).filter(Wallet.user_id == funding.user_id).with_for_update().first()
    )
    if wallet is None:
        funding.status = FundingStatus.FAILED.value
        funding.failure_reason = 'User has no wallet to credit.'
        db.commit()
        logger.error('Funding %s succeeded at Squad but user has no wallet.', reference)
        return funding

    wallet.balance = wallet.balance + funding.amount
    funding.status = FundingStatus.SUCCESS.value
    funding.completed_at = _now()
    db.commit()

    logger.info('Funding %s credited NGN %s — wallet balance now %s', reference, funding.amount, wallet.balance)
    return funding


def credit_from_virtual_account(
    db: Session,
    alias_account_number: str,
    amount: Decimal,
    nomba_transaction_id: str,
) -> WalletFunding | None:
    """Credit a wallet from a Nomba ``payment_success`` webhook (VA transfer).

    Unlike the checkout flow there is no pre-existing PENDING row — a static
    virtual account can be paid into at any time — so we mint a SUCCESS
    ``WalletFunding`` here. Idempotency is keyed on Nomba's ``transactionId``
    (stored in ``squad_transaction_ref``): a retried webhook is a no-op.

    Returns the funding row, or ``None`` if no user owns that virtual account.
    """
    existing = (
        db.query(WalletFunding)
        .filter(WalletFunding.squad_transaction_ref == nomba_transaction_id)
        .first()
    )
    if existing is not None:
        logger.info('VA credit %s already processed — ignoring.', nomba_transaction_id)
        return existing

    user: User | None = (
        db.query(User).filter(User.virtual_account_number == alias_account_number).first()
    )
    if user is None:
        logger.warning('VA credit for unknown account %s — ignoring.', alias_account_number)
        return None

    # Lock the wallet row so overlapping deliveries can't both double-credit.
    wallet: Wallet | None = (
        db.query(Wallet).filter(Wallet.user_id == user.id).with_for_update().first()
    )

    funding = WalletFunding(
        user_id=user.id,
        reference=_generate_reference(),
        squad_transaction_ref=nomba_transaction_id,
        amount=amount,
        currency='NGN',
        status=FundingStatus.PENDING.value,
    )
    db.add(funding)

    if wallet is None:
        funding.status = FundingStatus.FAILED.value
        funding.failure_reason = 'User has no wallet to credit.'
        db.commit()
        logger.error('VA credit for %s but user %s has no wallet.', alias_account_number, user.id)
        return funding

    wallet.balance = wallet.balance + amount
    funding.status = FundingStatus.SUCCESS.value
    funding.completed_at = _now()
    db.commit()

    logger.info('VA credit %s: +NGN %s for user %s — balance now %s', nomba_transaction_id, amount, user.id, wallet.balance)
    return funding
