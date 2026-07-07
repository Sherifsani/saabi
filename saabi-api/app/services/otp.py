import logging

from twilio.base.exceptions import TwilioRestException
from twilio.rest import Client

from app.config import settings

logger = logging.getLogger(__name__)


def _client() -> Client:
    return Client(settings.twilio_account_sid, settings.twilio_auth_token)


def send_otp(phone_number: str) -> None:
    """Start a Twilio Verify verification — Twilio generates and delivers the OTP."""
    if settings.twilio_demo_mode:
        logger.warning('(DEMO MODE) Skipping Twilio Verify send for %s', phone_number)
        return

    _client().verify.v2.services(settings.twilio_verify_service_sid).verifications.create(
        to=phone_number,
        channel=settings.twilio_otp_channel,
    )

    logger.info('OTP sent to %s via %s', phone_number, settings.twilio_otp_channel)


def verify_otp(phone_number: str, code: str) -> bool:
    """Check a code against Twilio Verify. Returns True if approved."""
    if settings.twilio_demo_mode:
        return code == '000000'

    try:
        check = (
            _client()
            .verify.v2.services(settings.twilio_verify_service_sid)
            .verification_checks.create(
                to=phone_number,
                code=code,
            )
        )
        return check.status == 'approved'
    except TwilioRestException:
        return False
