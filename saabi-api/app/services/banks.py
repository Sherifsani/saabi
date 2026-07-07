"""
Bank name → Nomba bank-code resolution.

Users on WhatsApp type informal bank names ("GTBank", "first bank", "gtb").
We map a curated alias set to the canonical bank code Nomba's payout API
accepts, plus a display name we echo back to the user for confirmation.

Codes are Nomba's official list (standard NUBAN codes, e.g. GTBank is ``058``),
fetched from ``GET /v1/transfers/banks``. Only banks present in that list are
included, so we never resolve an alias to a code Nomba would reject. The set
below covers the commercial banks, the major digital/neobanks and the
payment-service banks Nigerian users most commonly reference.

To refresh after Nomba updates their list, re-fetch ``/v1/transfers/banks`` and
reconcile the aliases here against the returned ``{name, code}`` pairs.
"""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass(frozen=True)
class Bank:
    code: str
    name: str


_BANKS: dict[str, Bank] = {
    # ── Commercial banks ──────────────────────────────────────────────
    'access bank': Bank('044', 'Access Bank'),
    'access': Bank('044', 'Access Bank'),
    'citi bank': Bank('023', 'Citibank Nigeria'),
    'citibank': Bank('023', 'Citibank Nigeria'),
    'diamond bank': Bank('063', 'Diamond Bank'),
    'diamond': Bank('063', 'Diamond Bank'),
    'ecobank': Bank('050', 'Ecobank Nigeria'),
    'eco bank': Bank('050', 'Ecobank Nigeria'),
    'enterprise bank': Bank('084', 'Enterprise Bank'),
    'fcmb': Bank('214', 'First City Monument Bank'),
    'first city monument bank': Bank('214', 'First City Monument Bank'),
    'fidelity bank': Bank('070', 'Fidelity Bank'),
    'fidelity': Bank('070', 'Fidelity Bank'),
    'first bank': Bank('011', 'First Bank of Nigeria'),
    'firstbank': Bank('011', 'First Bank of Nigeria'),
    'first bank of nigeria': Bank('011', 'First Bank of Nigeria'),
    'fbn': Bank('011', 'First Bank of Nigeria'),
    'globus bank': Bank('000027', 'Globus Bank'),
    'globus': Bank('000027', 'Globus Bank'),
    'gtbank': Bank('058', 'Guaranty Trust Bank'),
    'gtb': Bank('058', 'Guaranty Trust Bank'),
    'gt bank': Bank('058', 'Guaranty Trust Bank'),
    'guaranty trust': Bank('058', 'Guaranty Trust Bank'),
    'guaranty trust bank': Bank('058', 'Guaranty Trust Bank'),
    'heritage bank': Bank('030', 'Heritage Bank'),
    'heritage': Bank('030', 'Heritage Bank'),
    'jaiz bank': Bank('301', 'Jaiz Bank'),
    'jaiz': Bank('301', 'Jaiz Bank'),
    'keystone bank': Bank('082', 'Keystone Bank'),
    'keystone': Bank('082', 'Keystone Bank'),
    'key stone': Bank('082', 'Keystone Bank'),
    'lotus bank': Bank('000029', 'Lotus Bank'),
    'lotus': Bank('000029', 'Lotus Bank'),
    'parallex bank': Bank('526', 'Parallex Bank'),
    'parallex': Bank('526', 'Parallex Bank'),
    'polaris bank': Bank('076', 'Polaris Bank'),
    'polaris': Bank('076', 'Polaris Bank'),
    'premium trust bank': Bank('000031', 'Premium Trust Bank'),
    'premium trust': Bank('000031', 'Premium Trust Bank'),
    'providus bank': Bank('101', 'Providus Bank'),
    'providus': Bank('101', 'Providus Bank'),
    'stanbic ibtc': Bank('039', 'Stanbic IBTC Bank'),
    'stanbic ibtc bank': Bank('039', 'Stanbic IBTC Bank'),
    'stanbic': Bank('039', 'Stanbic IBTC Bank'),
    'stanbicibtc': Bank('039', 'Stanbic IBTC Bank'),
    'standard chartered': Bank('068', 'Standard Chartered Bank'),
    'standard chartered bank': Bank('068', 'Standard Chartered Bank'),
    'sterling bank': Bank('232', 'Sterling Bank'),
    'sterling': Bank('232', 'Sterling Bank'),
    'suntrust bank': Bank('100', 'SunTrust Bank'),
    'suntrust': Bank('100', 'SunTrust Bank'),
    'taj bank': Bank('000026', 'Taj Bank'),
    'taj': Bank('000026', 'Taj Bank'),
    'titan trust bank': Bank('000025', 'Titan Trust Bank'),
    'titan trust': Bank('000025', 'Titan Trust Bank'),
    'uba': Bank('033', 'United Bank for Africa'),
    'united bank for africa': Bank('033', 'United Bank for Africa'),
    'union bank': Bank('032', 'Union Bank of Nigeria'),
    'union': Bank('032', 'Union Bank of Nigeria'),
    'unity bank': Bank('215', 'Unity Bank'),
    'unity': Bank('215', 'Unity Bank'),
    'wema bank': Bank('035', 'Wema Bank'),
    'wema': Bank('035', 'Wema Bank'),
    'alat': Bank('035', 'Wema Bank'),
    'zenith bank': Bank('057', 'Zenith Bank'),
    'zenith': Bank('057', 'Zenith Bank'),

    # ── Digital / neobanks (consumer-facing MFBs) ─────────────────────
    'ab microfinance': Bank('090270', 'AB Microfinance Bank'),
    'ab mfb': Bank('090270', 'AB Microfinance Bank'),
    'accion': Bank('090134', 'Accion Microfinance Bank'),
    'accion mfb': Bank('090134', 'Accion Microfinance Bank'),
    'carbon': Bank('100026', 'Carbon'),
    'fairmoney': Bank('090551', 'Fairmoney Microfinance Bank'),
    'fair money': Bank('090551', 'Fairmoney Microfinance Bank'),
    'kuda bank': Bank('090267', 'Kuda Microfinance Bank'),
    'kuda': Bank('090267', 'Kuda Microfinance Bank'),
    'lapo': Bank('090177', 'Lapo Microfinance Bank'),
    'lapo mfb': Bank('090177', 'Lapo Microfinance Bank'),
    'mkobo': Bank('090455', 'Mkobo Microfinance Bank'),
    'mkobo mfb': Bank('090455', 'Mkobo Microfinance Bank'),
    'moniepoint': Bank('090405', 'Moniepoint Microfinance Bank'),
    'monie point': Bank('090405', 'Moniepoint Microfinance Bank'),
    'nirsal': Bank('090194', 'Nirsal Microfinance Bank'),
    'nirsal mfb': Bank('090194', 'Nirsal Microfinance Bank'),
    'page financials': Bank('070008', 'Page Financials'),
    'page': Bank('070008', 'Page Financials'),
    'renmoney': Bank('090198', 'RenMoney Microfinance Bank'),
    'ren money': Bank('090198', 'RenMoney Microfinance Bank'),
    'sparkle bank': Bank('090325', 'Sparkle'),
    'sparkle': Bank('090325', 'Sparkle'),
    'vfd': Bank('566', 'VFD Microfinance Bank'),
    'vfd mfb': Bank('566', 'VFD Microfinance Bank'),

    # ── Payment service banks & standalone wallets ────────────────────
    'opay': Bank('305', 'Opay (Paycom)'),
    'o pay': Bank('305', 'Opay (Paycom)'),
    'paycom': Bank('305', 'Opay (Paycom)'),
    'palmpay': Bank('100033', 'PalmPay'),
    'palm pay': Bank('100033', 'PalmPay'),
    'paga': Bank('327', 'Paga'),
    'access yellow': Bank('100052', 'Access Yellow'),
    'access yello': Bank('100052', 'Access Yellow'),
    'etranzact': Bank('306', 'eTranzact'),
    '9psb': Bank('120001', '9 Payment Service Bank'),
    '9 psb': Bank('120001', '9 Payment Service Bank'),
    'hope psb': Bank('120002', 'Hope Payment Service Bank'),
    'hopepsb': Bank('120002', 'Hope Payment Service Bank'),
    'momo psb': Bank('120003', 'MoMo Payment Service Bank'),
    'momo': Bank('120003', 'MoMo Payment Service Bank'),
}


_BY_CODE: dict[str, Bank] = {b.code: b for b in _BANKS.values()}

# Match longest aliases first so multi-word names ("first city monument bank")
# beat single-word prefixes ("first bank").
_SORTED_ALIASES: list[str] = sorted(_BANKS.keys(), key=len, reverse=True)


def resolve(text: str) -> Bank | None:
    """Find the first bank alias mentioned in ``text``.

    Matching is case-insensitive and respects token boundaries so "wema" does
    not match "swematic". Longest aliases are tried first to avoid prefix
    collisions between, e.g., "first bank" and "first city monument bank".
    """
    haystack = text.lower()
    for alias in _SORTED_ALIASES:
        pattern = rf'(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])'
        if re.search(pattern, haystack):
            return _BANKS[alias]
    return None


def by_code(code: str) -> Bank | None:
    return _BY_CODE.get(code)
