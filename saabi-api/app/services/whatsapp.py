"""
Outbound WhatsApp messaging via Twilio + TwiML reply helpers.

For the webhook synchronous reply we return TwiML (Twilio dispatches it as
the response message). For out-of-band sends (e.g. when a later async event
needs to nudge the user) we use the REST client.
"""

from __future__ import annotations

import logging

from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse

from app.config import settings

logger = logging.getLogger(__name__)


def _client() -> Client:
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)


def twiml_reply(message: str) -> str:
    response = MessagingResponse()
    response.message(message)
    return str(response)


def send(to_phone_number: str, message: str) -> None:
    """Push a WhatsApp message to ``to_phone_number`` (E.164, no prefix)."""
    if settings.twilio_demo_mode:
        logger.warning('(DEMO MODE) Skipping outbound WhatsApp to %s: %s', to_phone_number, message)
        return

    # Tolerate a configured number that already carries the channel prefix, so
    # we never end up sending from 'whatsapp:whatsapp:+1...'.
    from_number = settings.twilio_whatsapp_number.removeprefix('whatsapp:')

    _client().messages.create(
        from_=f'whatsapp:{from_number}',
        to=f'whatsapp:{to_phone_number}',
        body=message,
    )
