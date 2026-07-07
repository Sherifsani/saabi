from __future__ import annotations

import asyncio
import json
import logging
from decimal import Decimal, InvalidOperation
from typing import Annotated, Any, Optional

from fastapi import APIRouter, Depends, Form, HTTPException, Request, Response, status

from sqlalchemy.orm import Session
from twilio.request_validator import RequestValidator

from app.config import settings
from app.database import load_database
from app.models.user import User
from app.services import discovery as discovery_service
from app.services import funding as funding_service
from app.services import llm
from app.services import nomba as nomba_service
from app.services import payments, whatsapp
from app.services.intent_parser import Intent, IntentKind
from app.services.intent_parser import parse as parse_intent



router = APIRouter(prefix='/webhooks', tags=['webhooks'])
logger = logging.getLogger(__name__)




@router.post('/twilio/whatsapp')
async def whatsapp_inbound(
    request: Request,
    From: Annotated[str, Form()],
    Body: Annotated[str, Form()],
    MessageSid: Annotated[Optional[str], Form()] = None,
    db: Session = Depends(load_database),
):
    await _validate_signature(request)

    phone_number = _normalise_from(From)
    body = (Body or '').strip()

    logger.info('WhatsApp inbound sid=%s from=%s body=%r', MessageSid, phone_number, body)

    user: User | None = db.query(User).filter(User.phone_number == phone_number).first()
    if not user:
        return _twiml('This number is not registered with SAABI. Visit our portal to sign up before sending payments.')
    if not user.phone_verified:
        return _twiml('Your phone number is not yet verified. Complete OTP verification first.')

    pending = payments.get_active_pending(db, user)
    intent = parse_intent(body)

    if pending:
        if intent.kind == IntentKind.CANCEL:
            return _twiml(payments.cancel_pending(db, user))
        if intent.kind == IntentKind.PCT_LIKE:
            return _twiml(await payments.confirm(db, user, body))
        return _twiml(
            'You have a pending transaction awaiting confirmation. '
            'Reply with your Payment Confirmation Token to send, or CANCEL to abort.'
        )

    return _twiml(await _dispatch_intent(db, user, intent, body))


async def _dispatch_intent(db: Session, user: User, intent: Intent, body: str) -> str:
    if intent.kind == IntentKind.PAYMENT:
        assert intent.amount is not None
        assert intent.account_number is not None
        assert intent.bank_code is not None
        assert intent.bank_name is not None
        return await payments.initiate(
            db,
            user,
            amount=intent.amount,
            recipient_account_number=intent.account_number,
            recipient_bank_code=intent.bank_code,
            recipient_bank_name=intent.bank_name,
            raw_message=body,
        )

    if intent.kind == IntentKind.GREETING:
        return _greeting_reply()

    if intent.kind == IntentKind.PAYMENT_INCOMPLETE:
        return _missing_field_reply(intent)

    if intent.kind == IntentKind.BALANCE:
        return payments.show_balance(db, user)

    if intent.kind == IntentKind.STATUS:
        return payments.show_status(db, user)

    if intent.kind == IntentKind.HELP:
        return payments.help_text()

    if intent.kind == IntentKind.FUND:
        return await _handle_fund(db, user)

    if intent.kind == IntentKind.DISCOVERY:
        return await _handle_discovery(db, body)

    if intent.kind == IntentKind.REGISTER_WORKER:
        return await _handle_register(db, user, body)

    if intent.kind == IntentKind.CANCEL:
        return 'You have no pending transaction to cancel.'

    if intent.kind == IntentKind.PCT_LIKE:
        return 'You have no pending transaction. Start one with something like: "send 2500 naira to 0123456789 GTBank".'

    # Regex was inconclusive — let the LLM take a fuzzy pass before giving up.
    guessed = await asyncio.to_thread(llm.classify, body)
    if guessed == 'FUND':
        return await _handle_fund(db, user)
    if guessed == 'DISCOVERY':
        return await _handle_discovery(db, body)
    if guessed == 'REGISTER_WORKER':
        return await _handle_register(db, user, body)

    return 'I didn\'t understand that. Try: "send 2500 naira to 0123456789 GTBank", or reply HELP for options.'


async def _handle_fund(db: Session, user: User) -> str:
    try:
        account_number = await funding_service.ensure_virtual_account(db, user)
    except ValueError as exc:
        logger.error('Virtual account provisioning failed for %s: %s', user.phone_number, exc)
        return 'Sorry, I could not set up wallet funding right now. Please try again shortly.'

    return (
        'To fund your SAABI wallet, transfer any amount to:\n\n'
        f'• Account number: {account_number}\n'
        '• Bank: Nombank MFB\n\n'
        'It reflects in your wallet instantly. Reply "balance" to check.'
    )


async def _handle_discovery(db: Session, body: str) -> str:
    fields = await asyncio.to_thread(llm.extract_discovery, body)
    category, lga = fields.get('category'), fields.get('lga')
    if not category and not lga:
        return 'What service are you looking for, and where? e.g. "find a plumber in Yaba".'
    return discovery_service.search_reply(db, category, lga)


async def _handle_register(db: Session, user: User, body: str) -> str:
    fields = await asyncio.to_thread(llm.extract_worker, body)
    return discovery_service.register_reply(
        db,
        user,
        full_name=fields.get('full_name'),
        service_category=fields.get('service_category'),
        lga=fields.get('lga'),
        base_rate=fields.get('base_rate'),
        service_description=fields.get('service_description'),
    )


def _greeting_reply() -> str:
    return (
        'Hi! I\'m your friendly personal assistant from SAABI!, what shall we do today?\n\nSend "HELP" to learn more.'
    )


def _missing_field_reply(intent: Intent) -> str:
    if intent.missing == 'account_number':
        return 'Please include the recipient 10-digit account number.'
    if intent.missing == 'amount':
        return 'Please include the amount in naira, e.g. "send 2500 naira to 0123456789 GTBank".'
    if intent.missing == 'bank':
        return 'Please include the recipient bank name (e.g. GTBank, Access, UBA).'
    return 'Your request is missing some information. Reply HELP for the format.'


def _twiml(message: str) -> Response:
    body = whatsapp.twiml_reply(message)
    logger.info('TwiML reply: %s', body)
    return Response(content=body, media_type='application/xml')


def _normalise_from(raw: str) -> str:
    """Twilio sends 'whatsapp:+234XXX' — strip the channel prefix."""
    if raw.startswith('whatsapp:'):
        return raw[len('whatsapp:') :]
    return raw


def _flatten_event(payload: dict[str, Any]) -> dict[str, Any]:
    """Merge the webhook's top level with nested ``data``/``data.transaction``.

    Nomba nests most useful fields under ``data`` (and sometimes a further
    ``transaction`` object), so we build one flat view for field extraction.
    """
    flat: dict[str, Any] = {}
    data = payload.get('data') if isinstance(payload.get('data'), dict) else {}
    txn = data.get('transaction') if isinstance(data.get('transaction'), dict) else {}
    for source in (payload, data, txn):
        for key, value in source.items():
            if not isinstance(value, (dict, list)):
                flat[key] = value
    return flat


def _to_decimal(value: Any) -> Decimal | None:
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


@router.post('/nomba')
async def nomba_webhook(
    request: Request,
    db: Session = Depends(load_database),
):
    """Receive and reconcile Nomba webhooks.

    Two event families matter:

    * ``payment_success`` — an incoming transfer to a user's virtual account.
      This *mints* wallet balance, so the signature is non-negotiable.
    * ``payout_success`` / ``payout_failed`` / ``payout_refund`` — the terminal
      state of an outbound transfer we submitted; reconciled by ``merchantTxRef``.

    Nomba signs a colon-delimited field string with HMAC-SHA256 (Base64) in the
    ``nomba-signature`` header — verified before we trust a single byte.
    """
    raw_body = await request.body()
    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Webhook body is not valid JSON.') from exc

    signature = request.headers.get('nomba-signature')
    if not nomba_service.verify_webhook_signature(payload, signature):
        logger.warning('Nomba webhook rejected: bad or missing signature.')
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Invalid Nomba signature.')

    flat = _flatten_event(payload)
    event_type = str(flat.get('event_type') or flat.get('eventType') or '').lower()
    logger.info('Nomba webhook event=%s', event_type)

    if event_type == 'payment_success':
        return _handle_payment_success(db, flat)
    if event_type in ('payout_success', 'payout_failed', 'payout_refund'):
        return _handle_payout(db, event_type, flat)

    logger.info('Nomba webhook %s — no handler, acknowledging.', event_type)
    return {'received': True, 'handled': False}


def _handle_payment_success(db: Session, flat: dict[str, Any]) -> dict[str, Any]:
    account_number = flat.get('aliasAccountNumber') or flat.get('accountNumber')
    amount = _to_decimal(flat.get('transactionAmount') or flat.get('amount'))
    transaction_id = flat.get('transactionId') or flat.get('transaction_id')

    if not account_number or amount is None or not transaction_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='payment_success missing account number, amount or transactionId.',
        )

    funding = funding_service.credit_from_virtual_account(db, account_number, amount, str(transaction_id))
    if funding is None:
        return {'received': True, 'matched': False}

    # Nudge the funded user out-of-band (no-op in demo mode).
    user: User | None = db.query(User).filter(User.id == funding.user_id).first()
    if user is not None and funding.status == 'SUCCESS':
        wallet = user.wallet
        balance = f'NGN {wallet.balance:,.2f}' if wallet else 'your wallet'
        whatsapp.send(
            user.phone_number,
            f'Wallet funded: NGN {amount:,.2f} received. New balance: {balance}.',
        )

    return {'received': True, 'matched': True, 'status': funding.status}


def _handle_payout(db: Session, event_type: str, flat: dict[str, Any]) -> dict[str, Any]:
    reference = flat.get('merchantTxRef') or flat.get('merchant_tx_ref') or flat.get('reference')
    message = flat.get('narration') or flat.get('message')
    status_value = {'payout_success': 'success', 'payout_failed': 'failed', 'payout_refund': 'reversed'}[event_type]

    if not reference:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='payout event missing merchantTxRef.')

    tx = payments.apply_external_status(db, reference, status_value, message)
    if tx is None:
        logger.info('Nomba payout webhook for unknown reference %s — ignoring', reference)
        return {'received': True, 'matched': False}

    logger.info('Nomba payout webhook reconciled %s -> %s', reference, tx.status)
    return {'received': True, 'matched': True, 'status': tx.status}


async def _validate_signature(request: Request) -> None:
    if settings.twilio_demo_mode:
        return

    signature = request.headers.get('X-Twilio-Signature', '')
    if not signature:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Missing Twilio signature.')

    form = await request.form()
    params = {k: v for k, v in form.multi_items() if isinstance(v, str)}

    validator = RequestValidator(settings.twilio_auth_token)
    for candidate in _candidate_urls(request):
        if validator.validate(candidate, params, signature):
            return

    logger.warning('Twilio signature failed. Tried URLs: %s', list(_candidate_urls(request)))
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Invalid Twilio signature.')


def _candidate_urls(request: Request) -> list[str]:
    proto = request.headers.get('x-forwarded-proto', request.url.scheme)
    host = request.headers.get('x-forwarded-host') or request.headers.get('host') or request.url.netloc
    path_qs = request.url.path

    if request.url.query:
        path_qs = f'{path_qs}?{request.url.query}'

    urls = [
        f'{proto}://{host}{path_qs}',
        f'https://{host}{path_qs}',
        str(request.url),
    ]

    seen: set[str] = set()
    return [u for u in urls if not (u in seen or seen.add(u))]
