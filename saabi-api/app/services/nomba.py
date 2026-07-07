"""
Nomba API integration (replaces the former Squad integration).

Architecturally unchanged from before: Nomba holds a single merchant-pool
ledger; ``/v2/transfers/bank`` debits *that* pool. Our per-user ``Wallet``
table is an internal virtual ledger overlaid on it. The invariant we preserve:

    Σ(user wallet balances) ≤ Nomba merchant ledger balance

Relevant Nomba endpoints (all require ``Authorization: Bearer <token>`` and an
``accountId`` header = the parent business account UUID):

  - ``POST /v1/auth/token/issue``      — OAuth2 client-credentials token
  - ``POST /v1/transfers/bank/lookup`` — resolve recipient name (pre-transfer)
  - ``POST /v2/transfers/bank``        — debit merchant ledger, queue a payout
  - ``POST /v1/accounts/virtual``      — create a static virtual account (funding)

Access tokens expire in ~30 minutes, so we cache one process-wide and refresh
it lazily (5 minutes before expiry) behind an async lock.

A payout can return ``PENDING_BILLING`` and later flip to success/failed. We
therefore trust Nomba's ``payout_*`` webhooks for the terminal state rather
than assuming the immediate response is final.
"""

from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Optional, TypedDict

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

# ── Auth token cache ──────────────────────────────────────────────────

_token: Optional[str] = None
_token_expiry: datetime = datetime.min.replace(tzinfo=timezone.utc)
_refresh_token: Optional[str] = None
_token_lock = asyncio.Lock()

# Refresh this long before the reported expiry so an in-flight request never
# races the 30-minute boundary.
_TOKEN_SKEW = timedelta(minutes=5)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _base_headers() -> dict[str, str]:
    return {
        'accountId': settings.nomba_account_id,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }


def _parse_expiry(value: Any) -> datetime:
    """Parse Nomba's ISO-8601 ``expiresAt``; fall back to a conservative 25m."""
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace('Z', '+00:00'))
        except ValueError:
            pass
    return _now() + timedelta(minutes=25)


async def _issue_token(client: httpx.AsyncClient) -> None:
    """Fetch a fresh token, preferring refresh_token over client credentials."""
    global _token, _token_expiry, _refresh_token

    if _refresh_token:
        body = {'grant_type': 'refresh_token', 'refresh_token': _refresh_token}
    else:
        body = {
            'grant_type': 'client_credentials',
            'client_id': settings.nomba_client_id,
            'client_secret': settings.nomba_client_secret,
        }

    response = await client.post(
        f'{settings.nomba_base_url}/v1/auth/token/issue',
        headers=_base_headers(),
        json=body,
    )
    if response.status_code != 200:
        # A stale refresh_token can 4xx — drop it and let the caller retry with
        # client credentials on the next attempt.
        _refresh_token = None
        raise ValueError(f'Nomba token issue failed (HTTP {response.status_code}): {response.text}')

    data = response.json()
    payload = data.get('data', data)
    _token = payload.get('access_token')
    _refresh_token = payload.get('refresh_token') or _refresh_token
    _token_expiry = _parse_expiry(payload.get('expiresAt'))
    if not _token:
        raise ValueError(f'Nomba token response missing access_token: {data}')
    logger.info('Nomba token refreshed, valid until %s', _token_expiry.isoformat())


async def _auth_headers() -> dict[str, str]:
    """Return headers with a valid bearer token, refreshing if near expiry."""
    global _token
    async with _token_lock:
        if _token is None or _now() >= _token_expiry - _TOKEN_SKEW:
            async with httpx.AsyncClient(timeout=15.0) as client:
                await _issue_token(client)
    return {**_base_headers(), 'Authorization': f'Bearer {_token}'}


# ── Typed results ─────────────────────────────────────────────────────


class BankAccountInfo(TypedDict):
    account_name: str
    account_number: str
    bank_code: str


class TransferResult(TypedDict):
    reference: str
    status: str  # 'success' | 'pending' | 'failed'
    message: str


class VirtualAccountInfo(TypedDict):
    account_number: str
    account_name: str
    bank_name: str
    account_ref: str


# Nomba payout statuses → our normalised lowercase vocabulary.
_STATUS_MAP = {
    'success': 'success',
    'pending_billing': 'pending',
    'pending': 'pending',
    'failed': 'failed',
    'failure': 'failed',
    'reversed': 'reversed',
    'refund': 'reversed',
}


def _normalise_status(raw: Optional[str]) -> str:
    return _STATUS_MAP.get((raw or '').strip().lower(), (raw or '').strip().lower() or 'pending')


# ── Bank account lookup ───────────────────────────────────────────────


async def lookup_bank_account(account_number: str, bank_code: str) -> BankAccountInfo:
    """Resolve the account name for an account number + bank code.

    Used during registration (identity check) and before every payment (show
    recipient details before the user confirms).
    """
    headers = await _auth_headers()
    url = f'{settings.nomba_base_url}/v1/transfers/bank/lookup'

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.post(
            url,
            headers=headers,
            json={'accountNumber': account_number, 'bankCode': bank_code},
        )

    if response.status_code != 200:
        raise ValueError(f'Bank account lookup failed: {response.text}')

    data = response.json()
    detail = data.get('data') or {}
    account_name = detail.get('accountName')
    if not account_name:
        raise ValueError(f'Bank account lookup returned no name: {data.get("description") or data}')

    return BankAccountInfo(
        account_name=account_name,
        account_number=account_number,
        bank_code=bank_code,
    )


# ── Payout / transfer ─────────────────────────────────────────────────


async def transfer(
    amount: Decimal,
    recipient_account_number: str,
    recipient_bank_code: str,
    recipient_account_name: str,
    reference: str,
    sender_name: Optional[str] = None,
    narration: Optional[str] = None,
) -> TransferResult:
    """Initiate an outbound bank transfer via Nomba's payout API.

    ``amount`` is in Naira (major units) — Nomba's transfer API takes the major
    unit, not kobo. ``reference`` is our unique per-transaction id and doubles
    as Nomba's ``merchantTxRef`` idempotency key.
    """
    headers = await _auth_headers()
    url = f'{settings.nomba_base_url}/v2/transfers/bank'
    payload: dict[str, Any] = {
        'amount': float(amount),
        'accountNumber': recipient_account_number,
        'accountName': recipient_account_name,
        'bankCode': recipient_bank_code,
        'merchantTxRef': reference,
        'narration': narration or f'SAABI transfer to {recipient_account_name}',
    }
    if sender_name:
        payload['senderName'] = sender_name

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=payload)

    if response.status_code not in (200, 201):
        raise ValueError(f'Transfer failed (HTTP {response.status_code}): {response.text}')

    data = response.json()
    detail = data.get('data') or {}
    logger.info('Nomba transfer %s -> HTTP %s, body=%s', reference, response.status_code, data)

    status = _normalise_status(detail.get('status') or data.get('status'))
    if status == 'failed':
        raise ValueError(detail.get('message') or data.get('description') or 'Transfer failed')

    return TransferResult(
        reference=reference,
        status=status,
        message=str(detail.get('narration') or data.get('description') or ''),
    )


# ── Virtual account (wallet funding) ──────────────────────────────────


async def create_virtual_account(
    account_ref: str,
    account_name: str,
    bvn: Optional[str] = None,
    expiry_date: Optional[str] = None,
    expected_amount: Optional[Decimal] = None,
) -> VirtualAccountInfo:
    """Create a virtual account.

    Without ``expiry_date``/``expected_amount`` this is a *static* account for
    in-chat wallet funding: any transfer into the returned ``account_number``
    triggers a Nomba ``payment_success`` webhook we reconcile to credit the
    wallet. Passing an expiry and expected amount makes it a *dynamic* account
    scoped to a single one-off collection. Nomba requires ``accountRef`` 16-64
    chars and ``accountName`` 8-64 chars.
    """
    headers = await _auth_headers()
    url = f'{settings.nomba_base_url}/v1/accounts/virtual'
    payload: dict[str, Any] = {'accountRef': account_ref, 'accountName': account_name}
    if bvn:
        payload['bvn'] = bvn
    if expiry_date:
        payload['expiryDate'] = expiry_date
    if expected_amount is not None:
        payload['expectedAmount'] = float(expected_amount)

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(url, headers=headers, json=payload)

    if response.status_code not in (200, 201):
        raise ValueError(f'Virtual account creation failed (HTTP {response.status_code}): {response.text}')

    data = response.json()
    detail = data.get('data') or {}
    account_number = detail.get('bankAccountNumber')
    if not account_number:
        raise ValueError(f'Virtual account response missing bankAccountNumber: {data}')

    return VirtualAccountInfo(
        account_number=account_number,
        account_name=detail.get('bankAccountName') or account_name,
        bank_name=detail.get('bankName') or 'Nombank MFB',
        account_ref=detail.get('accountRef') or account_ref,
    )


class CheckoutInfo(TypedDict):
    checkout_url: str
    order_reference: str


async def create_checkout_order(
    email: str,
    amount: Decimal,
    callback_url: str,
    customer_name: Optional[str] = None,
    order_reference: Optional[str] = None,
) -> CheckoutInfo:
    """Create a hosted online-checkout order and return its payment link.

    Used by the web dashboard for card/transfer payments. ``amount`` is in
    Naira. The user pays on Nomba's hosted page and is redirected to
    ``callback_url``; settlement is confirmed by the collection webhook.
    """
    headers = await _auth_headers()
    url = f'{settings.nomba_base_url}/v1/checkout/order'
    order: dict[str, Any] = {
        'callbackUrl': callback_url,
        'customerEmail': email,
        'amount': float(amount),
        'currency': 'NGN',
    }
    if customer_name:
        order['customerName'] = customer_name
    if order_reference:
        order['orderReference'] = order_reference

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(url, headers=headers, json={'order': order})

    if response.status_code not in (200, 201):
        raise ValueError(f'Checkout order failed (HTTP {response.status_code}): {response.text}')

    data = response.json()
    detail = data.get('data') or {}
    checkout_url = detail.get('checkoutLink')
    if not checkout_url:
        raise ValueError(f'Checkout response missing checkoutLink: {data}')

    return CheckoutInfo(
        checkout_url=checkout_url,
        order_reference=detail.get('orderReference') or order_reference or '',
    )


# ── Webhook signature verification ────────────────────────────────────
#
# Per Nomba's docs (https://developer.nomba.com/docs/api-basics/webhook), the
# signature is HMAC-SHA256 (Base64) over a colon-delimited string — NOT the raw
# body — built from these exact fields, in this order:
#
#   event_type : requestId : data.merchant.userId : data.merchant.walletId
#   : data.transaction.transactionId : data.transaction.type
#   : data.transaction.time : data.transaction.responseCode
#   : <nomba-timestamp header>
#
# Note the last field is the ``nomba-timestamp`` *header*, not a payload field,
# and userId/walletId live under ``data.merchant``.


def _s(value: Any) -> str:
    """Stringify a field; empty string for missing/null (Nomba uses '' for null)."""
    if value is None or (isinstance(value, str) and value.lower() == 'null'):
        return ''
    return str(value)


def signature_base(payload: dict[str, Any], timestamp: str | None) -> str:
    """Reconstruct the colon-delimited string Nomba signs. Exposed for tests."""
    data = payload.get('data') if isinstance(payload.get('data'), dict) else {}
    merchant = data.get('merchant') if isinstance(data.get('merchant'), dict) else {}
    txn = data.get('transaction') if isinstance(data.get('transaction'), dict) else {}
    fields = [
        _s(payload.get('event_type')),
        _s(payload.get('requestId')),
        _s(merchant.get('userId')),
        _s(merchant.get('walletId')),
        _s(txn.get('transactionId')),
        _s(txn.get('type')),
        _s(txn.get('time')),
        _s(txn.get('responseCode')),
        _s(timestamp),
    ]
    return ':'.join(fields)


def compute_signature(payload: dict[str, Any], timestamp: str | None) -> str:
    digest = hmac.new(
        settings.nomba_webhook_secret.encode(),
        signature_base(payload, timestamp).encode(),
        hashlib.sha256,
    ).digest()
    return base64.b64encode(digest).decode()


def verify_webhook_signature(payload: dict[str, Any], signature: str | None, timestamp: str | None) -> bool:
    """Constant-time check of the ``nomba-signature`` header.

    ``timestamp`` is the ``nomba-timestamp`` request header (part of the signed
    string). This guards the funding path in particular — a ``payment_success``
    webhook mints wallet balance, so an unauthenticated caller must never drive it.
    """
    if not signature or not settings.nomba_webhook_secret:
        return False
    return hmac.compare_digest(compute_signature(payload, timestamp), signature.strip())
