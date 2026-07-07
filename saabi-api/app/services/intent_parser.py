"""
Intent parsing for inbound WhatsApp messages.

Per spec: we use regex for amount and account number (deterministic, no
hallucination risk on the two values that move money) and pattern matching
for everything else. The contract is: turn free-form text into a typed
Intent dataclass that the payments orchestrator can act on.
"""

from __future__ import annotations

import enum
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from typing import Optional

from app.services import banks


class IntentKind(str, enum.Enum):
    GREETING = 'GREETING'
    PAYMENT = 'PAYMENT'
    PAYMENT_INCOMPLETE = 'PAYMENT_INCOMPLETE'
    BALANCE = 'BALANCE'
    STATUS = 'STATUS'
    HELP = 'HELP'
    CANCEL = 'CANCEL'
    PCT_LIKE = 'PCT_LIKE'
    FUND = 'FUND'
    DISCOVERY = 'DISCOVERY'
    REGISTER_WORKER = 'REGISTER_WORKER'
    UNKNOWN = 'UNKNOWN'


@dataclass
class Intent:
    kind: IntentKind
    amount: Optional[Decimal] = None
    account_number: Optional[str] = None
    bank_code: Optional[str] = None
    bank_name: Optional[str] = None
    missing: Optional[str] = None


_PAYMENT_VERBS = re.compile(
    r'\b(send|sent|transfer|transferr|pay|wire|remit|dispatch|move)\b',
    re.IGNORECASE,
)
_ACCOUNT_RE = re.compile(r'(?<!\d)(\d{10})(?!\d)')
_AMOUNT_RE = re.compile(
    r"""
    (?:[₦n]|ngn|naira)?\s*       # optional leading currency marker
    (?P<num>\d{1,3}(?:,\d{3})+|\d+)
    (?:\.(?P<frac>\d{1,2}))?
    \s*
    (?P<mult>k|m)?                # optional thousand/million suffix
    \s*
    (?:naira|ngn)?               # optional trailing currency marker
    """,
    re.IGNORECASE | re.VERBOSE,
)
_PCT_RE = re.compile(r'^[A-Za-z0-9]{4,8}$')

# Keyword cues for the three new capabilities. These are the "obvious form"
# regex first pass; anything ambiguous falls through to the LLM classifier in
# the webhook dispatcher.
_FUND_RE = re.compile(r'\b(fund|top\s?up|deposit|add\s+money|load\s+wallet|credit\s+my\s+wallet)\b', re.IGNORECASE)
_REGISTER_RE = re.compile(
    r"\b(register|list\s+me|sign\s+me\s+up|add\s+me\s+as|become\s+a\s+provider|i\s*(?:'|’)?m\s+a|i\s+work\s+as)\b",
    re.IGNORECASE,
)
_DISCOVERY_RE = re.compile(
    r'\b(find|looking\s+for|look\s+for|search\s+for|need\s+(?:a|an|some)|who\s+can|recommend)\b',
    re.IGNORECASE,
)


def parse(text: str) -> Intent:
    if not text or not text.strip():
        return Intent(kind=IntentKind.UNKNOWN)

    stripped = text.strip()
    lowered = stripped.lower()

    # haha
    if lowered in {'hi', 'hello', 'whats up', 'saabi', 'how far', 'hey', 'my gee', 'big man'}:
        return Intent(kind=IntentKind.GREETING)

    if lowered in {'balance', 'bal', 'wallet', 'my balance'}:
        return Intent(kind=IntentKind.BALANCE)
    if lowered in {'status', 'recent', 'last', 'history'}:
        return Intent(kind=IntentKind.STATUS)
    if lowered in {'help', '?', 'menu', 'commands'}:
        return Intent(kind=IntentKind.HELP)
    if lowered in {'cancel', 'stop', 'abort', 'no'}:
        return Intent(kind=IntentKind.CANCEL)

    # New capabilities, keyword first pass. Checked before the PCT shape test
    # because words like "fund"/"find" would otherwise look like a bare PCT.
    # Fields (category, LGA, rate) are extracted later by the LLM.
    if _FUND_RE.search(lowered):
        return Intent(kind=IntentKind.FUND)
    if _REGISTER_RE.search(lowered):
        return Intent(kind=IntentKind.REGISTER_WORKER)
    if _DISCOVERY_RE.search(lowered):
        return Intent(kind=IntentKind.DISCOVERY)

    # A bare token that fits the PCT shape (4–8 alphanumerics, no spaces) is
    # almost certainly a confirmation attempt, not a malformed payment.
    if _PCT_RE.match(stripped):
        return Intent(kind=IntentKind.PCT_LIKE)

    account = _extract_account(stripped)
    amount = _extract_amount(stripped, account)
    has_payment_verb = bool(_PAYMENT_VERBS.search(lowered))

    if account or amount or has_payment_verb:
        bank = banks.resolve(stripped)
        if not account:
            return Intent(
                kind=IntentKind.PAYMENT_INCOMPLETE,
                missing='account_number',
                amount=amount,
                bank_code=bank.code if bank else None,
                bank_name=bank.name if bank else None,
            )
        if not amount:
            return Intent(
                kind=IntentKind.PAYMENT_INCOMPLETE,
                missing='amount',
                account_number=account,
                bank_code=bank.code if bank else None,
                bank_name=bank.name if bank else None,
            )
        if not bank:
            return Intent(kind=IntentKind.PAYMENT_INCOMPLETE, missing='bank', amount=amount, account_number=account)
        return Intent(
            kind=IntentKind.PAYMENT,
            amount=amount,
            account_number=account,
            bank_code=bank.code,
            bank_name=bank.name,
        )

    return Intent(kind=IntentKind.UNKNOWN)


def _extract_account(text: str) -> Optional[str]:
    match = _ACCOUNT_RE.search(text)
    return match.group(1) if match else None


def _extract_amount(text: str, account: Optional[str]) -> Optional[Decimal]:
    # Strip account number to avoid mistakenly parsing it as the amount.
    scrubbed = text.replace(account, ' ', 1) if account else text

    best: Optional[Decimal] = None
    best_score = -1

    for match in _AMOUNT_RE.finditer(scrubbed):
        raw_num = match.group('num').replace(',', '')
        if not raw_num.isdigit():
            continue
        try:
            value = Decimal(raw_num)
        except InvalidOperation:
            continue

        frac = match.group('frac')
        if frac:
            value += Decimal(f'0.{frac}')

        mult = match.group('mult')
        if mult and mult.lower() == 'k':
            value *= 1000
        elif mult and mult.lower() == 'm':
            value *= 1_000_000

        if value <= 0:
            continue

        # Score: prefer matches that include a currency marker or multiplier.
        score = 0
        window = scrubbed[max(0, match.start() - 8) : match.end() + 8].lower()
        if any(token in window for token in ('₦', 'ngn', 'naira')) or mult:
            score += 2
        if match.group(0).strip().startswith(('₦', 'N', 'n')):
            score += 1

        if score > best_score or (score == best_score and (best is None or value > best)):
            best = value
            best_score = score

    return best
