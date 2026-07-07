"""
Nomba REST surface for the web dashboard (``saabi-ui``).

These endpoints wrap ``app/services/nomba.py`` so the frontend can perform the
merchant-level operations it needs — recipient lookup, payout, hosted
checkout, and virtual-account creation — without embedding Nomba credentials
in the browser. Responses are shaped as ``{"status": ..., "data": {...}}`` with
snake_case keys the frontend already consumes.

NOTE (security): payout debits the merchant pool and is currently unauthenticated
to preserve the existing demo behaviour. Before production, gate ``/payout``
(and ideally ``/va/*``) behind real authentication + per-user limits.
"""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.services import nomba as nomba_service

router = APIRouter(prefix='/api/nomba', tags=['Nomba API'])
logger = logging.getLogger(__name__)


# ── Request models ────────────────────────────────────────────────────

class LookupRequest(BaseModel):
    bank_code: str
    account_number: str


class PayoutRequest(BaseModel):
    amount: float  # Naira
    bank_code: str
    account_number: str
    account_name: str
    remark: Optional[str] = None


class CheckoutRequest(BaseModel):
    email: str
    amount: float  # Naira
    callback_url: Optional[str] = None
    customer_name: Optional[str] = None


class StaticVARequest(BaseModel):
    name: str
    email: str
    bvn: Optional[str] = None
    dob: Optional[str] = None
    mobile_num: Optional[str] = None


class DynamicVARequest(BaseModel):
    amount: float  # Naira
    duration_seconds: int = 3600
    email: str


def _account_ref(prefix: str) -> str:
    # Nomba requires accountRef 16-64 chars; prefix + hex keeps it unique.
    return f'{prefix}-{secrets.token_hex(12)}'


def _account_name(raw: str) -> str:
    # Nomba requires accountName 8-64 chars.
    name = (raw or '').strip() or 'SAABI User'
    return name if len(name) >= 8 else f'{name} SAABI'


# ── Endpoints ─────────────────────────────────────────────────────────

@router.post('/lookup')
async def account_lookup(payload: LookupRequest):
    """Resolve a recipient account name before a transfer."""
    try:
        info = await nomba_service.lookup_bank_account(payload.account_number, payload.bank_code)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return {'status': 'success', 'data': info}


@router.post('/payout')
async def payout(payload: PayoutRequest):
    """Send an outbound bank transfer, re-verifying the name for safety."""
    try:
        lookup = await nomba_service.lookup_bank_account(payload.account_number, payload.bank_code)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f'Lookup failed: {exc}') from exc

    if lookup['account_name'].strip().upper() != payload.account_name.strip().upper():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Account name mismatch. Transfer blocked for security.',
        )

    reference = f'SAABI_{secrets.token_hex(8)}'
    try:
        result = await nomba_service.transfer(
            amount=Decimal(str(payload.amount)),
            recipient_account_number=payload.account_number,
            recipient_bank_code=payload.bank_code,
            recipient_account_name=payload.account_name,
            reference=reference,
            narration=payload.remark or 'SAABI Payout',
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return {'status': result['status'], 'data': result}


@router.post('/checkout')
async def checkout(payload: CheckoutRequest):
    """Create a hosted checkout order and return its payment link."""
    try:
        info = await nomba_service.create_checkout_order(
            email=payload.email,
            amount=Decimal(str(payload.amount)),
            callback_url=payload.callback_url or '',
            customer_name=payload.customer_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return {'status': 'success', 'data': info}


@router.post('/va/static')
async def create_static_va(payload: StaticVARequest):
    """Create a static virtual account the customer can pay into repeatedly."""
    try:
        info = await nomba_service.create_virtual_account(
            account_ref=_account_ref('SAABI'),
            account_name=_account_name(payload.name),
            bvn=payload.bvn,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return {'status': 'success', 'data': info}


@router.post('/va/dynamic')
async def create_dynamic_va(payload: DynamicVARequest):
    """Create a short-lived virtual account scoped to one collection."""
    expiry = datetime.now(timezone.utc) + timedelta(seconds=payload.duration_seconds)
    try:
        info = await nomba_service.create_virtual_account(
            account_ref=_account_ref('SAABIDYN'),
            account_name=_account_name(payload.email.split('@')[0]),
            expiry_date=expiry.isoformat(),
            expected_amount=Decimal(str(payload.amount)),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return {
        'status': 'success',
        'data': {
            **info,
            'amount': str(payload.amount),
            'expires_in': f'{payload.duration_seconds // 60} minutes',
        },
    }
