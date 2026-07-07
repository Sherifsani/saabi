"""
Google Gemini helper for fuzzy intent classification and field extraction.

Deliberately narrow: the LLM only decides *which* fuzzy intent a free-text
message expresses (discovery / fund / worker registration) and pulls soft
fields like service category, LGA and rate. It **never** parses amounts or
account numbers — those stay in the deterministic regex path
(``app/services/intent_parser.py``) so money-moving values can't be hallucinated.

Every function degrades gracefully: if ``GEMINI_API_KEY`` is unset or the API
errors, they return ``None``/empty so the caller falls back to regex-only
behaviour. Calls are synchronous (the google-genai SDK is sync); callers on the
async request path should wrap them with ``asyncio.to_thread``.
"""

from __future__ import annotations

import json
import logging
from functools import lru_cache
from typing import Any, Optional

from app.config import settings

logger = logging.getLogger(__name__)

# Valid fuzzy-intent labels the classifier may return.
_INTENTS = {'DISCOVERY', 'FUND', 'REGISTER_WORKER'}


@lru_cache(maxsize=1)
def _client() -> Any | None:
    """Lazily build a Gemini client; ``None`` if unconfigured or SDK missing."""
    if not settings.gemini_api_key:
        return None
    try:
        from google import genai

        return genai.Client(api_key=settings.gemini_api_key)
    except Exception as exc:  # pragma: no cover - import/config guard
        logger.warning('Gemini client unavailable: %s', exc)
        return None


def _generate_json(prompt: str) -> Optional[dict[str, Any]]:
    """Run a prompt expecting a JSON object back; ``None`` on any failure."""
    client = _client()
    if client is None:
        return None
    try:
        from google.genai import types

        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type='application/json',
                temperature=0,
            ),
        )
        text = (response.text or '').strip()
        if not text:
            return None
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except Exception as exc:
        logger.warning('Gemini request failed: %s', exc)
        return None


def _clean(value: Any) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def classify(text: str) -> Optional[str]:
    """Classify a message into DISCOVERY / FUND / REGISTER_WORKER, or None.

    Used only as a fallback when the regex parser could not decide.
    """
    prompt = (
        'You are the intent classifier for a Nigerian fintech WhatsApp bot.\n'
        'Classify the user message into exactly one label:\n'
        '- DISCOVERY: they are looking for a service provider/worker '
        '(e.g. "find a plumber in Yaba", "any tailor around Ikeja?").\n'
        '- FUND: they want to add money / top up their wallet.\n'
        '- REGISTER_WORKER: they want to list themselves as a service provider.\n'
        '- NONE: anything else.\n'
        f'Message: {text!r}\n'
        'Respond as JSON: {"intent": "DISCOVERY|FUND|REGISTER_WORKER|NONE"}'
    )
    result = _generate_json(prompt)
    if not result:
        return None
    intent = _clean(result.get('intent'))
    return intent if intent in _INTENTS else None


def extract_discovery(text: str) -> dict[str, Optional[str]]:
    """Extract {category, lga} from a discovery message."""
    prompt = (
        'Extract the service being sought and the location (Nigerian Local '
        'Government Area / neighbourhood) from this WhatsApp message.\n'
        f'Message: {text!r}\n'
        'Respond as JSON: {"category": <service or null>, "lga": <location or null>}'
    )
    result = _generate_json(prompt) or {}
    return {'category': _clean(result.get('category')), 'lga': _clean(result.get('lga'))}


def extract_worker(text: str) -> dict[str, Optional[str]]:
    """Extract worker-registration fields from a message."""
    prompt = (
        'A user wants to register as a service provider on a Nigerian '
        'marketplace. Extract these fields from their message.\n'
        f'Message: {text!r}\n'
        'Respond as JSON with keys: full_name, service_category, lga, '
        'base_rate (e.g. "5000/hr"), service_description. Use null for anything absent.'
    )
    result = _generate_json(prompt) or {}
    return {
        'full_name': _clean(result.get('full_name')),
        'service_category': _clean(result.get('service_category')),
        'lga': _clean(result.get('lga')),
        'base_rate': _clean(result.get('base_rate')),
        'service_description': _clean(result.get('service_description')),
    }
