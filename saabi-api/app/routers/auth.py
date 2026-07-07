import logging
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import load_database
from app.models.payment_confirmation_token import PaymentConfirmationToken
from app.models.user import User
from app.models.wallet import Wallet
from app.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    ResendOTPRequest,
    ResendOTPResponse,
    SetPCTRequest,
    SetPCTResponse,
    VerifyOTPRequest,
    VerifyOTPResponse,
    WalletDetails,
)
from app.services import nomba as nomba_service
from app.services import otp as otp_service
from app.services import pct as pct_service
from pydantic import BaseModel




router = APIRouter(prefix='/auth', tags=['auth'])
logger = logging.getLogger(__name__)

class LoginRequest(BaseModel):
    phone_number: str
    otp: str


class SetPCTRequest(BaseModel):
    phone_number: str
    pct: str

@router.post('/register', response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(load_database)):

    existing = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if existing and existing.phone_verified:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='A verified account already exists for this phone number.',
        )

    if existing:
        # Unverified re-registration — refresh details and resend OTP
        user = existing
        user.first_name = payload.first_name
        user.last_name = payload.last_name
        user.email = payload.email
        user.date_of_birth = payload.date_of_birth
        user.address = payload.address
        user.gender = payload.gender
        user.account_number = payload.account_number
        user.bank_code = payload.bank_code
        user.geo_lat = payload.geo_lat
        user.geo_lng = payload.geo_lng
    else:
        user = User(
            phone_number=payload.phone_number,
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            date_of_birth=payload.date_of_birth,
            address=payload.address,
            gender=payload.gender,
            account_verified=False,
            phone_verified=False,
            account_number=payload.account_number,
            bank_code=payload.bank_code,
            geo_lat=payload.geo_lat,
            geo_lng=payload.geo_lng,
        )
        db.add(user)

    db.commit()

    otp_service.send_otp(payload.phone_number)

    return RegisterResponse(
        message='OTP sent to your WhatsApp. Please verify within 10 minutes.',
        phone_number=payload.phone_number,
    )

@router.post("/login")
def login(request: LoginRequest):
    """Login with phone number and OTP."""
    return {"message": "Login successful", "token": "demo-token"}


@router.post('/resend-otp', response_model=ResendOTPResponse)
async def resend_otp(payload: ResendOTPRequest, db: Session = Depends(load_database)):

    user: User | None = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found.')

    if user.phone_verified:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Phone number is already verified.',
        )

    otp_service.send_otp(payload.phone_number)

    return ResendOTPResponse(
        message='Successfully resent OTP'
    )


@router.post('/verify-otp', response_model=VerifyOTPResponse)
async def verify_otp(payload: VerifyOTPRequest, db: Session = Depends(load_database)):

    user: User | None = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found.')

    if user.phone_verified:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail='Phone number is already verified.',
        )

    if not otp_service.verify_otp(payload.phone_number, payload.otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Invalid or expired OTP.',
        )

    # Use Nomba to verify the bank account name matches the registered name
    try:
        bank_info = await nomba_service.lookup_bank_account(user.account_number, user.bank_code)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f'Bank account verification failed: {exc}',
        ) from exc

    name_ok = (
        user.first_name.upper() in bank_info['account_name'].upper()
        and user.last_name.upper() in bank_info['account_name'].upper()
    )
    if not name_ok:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f'Bank account name "{bank_info["account_name"]}" does not match '
                f'the registered name "{user.first_name} {user.last_name}".'
            ),
        )

    # Create the user's internal wallet (zero balance, managed by us)
    wallet = Wallet(user_id=user.id, balance=Decimal('0.00'), currency='NGN')
    db.add(wallet)
    user.account_verified = True
    user.phone_verified = True
    db.commit()
    db.refresh(wallet)

    return VerifyOTPResponse(
        message='Verified. Your wallet is ready. Please set your Payment Confirmation Token.',
        wallet=WalletDetails(
            balance=str(wallet.balance),
            currency=wallet.currency,
        ),
        twilio_join_code=settings.twilio_join_code,
        twilio_whatsapp_number=settings.twilio_whatsapp_number,
        next_step='POST /auth/set-pct with your chosen Payment Confirmation Token.',
    )


@router.post('/set-pct', response_model=SetPCTResponse)
def set_pct(payload: SetPCTRequest, db: Session = Depends(load_database)):

    user: User | None = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found.')

    if not user.phone_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Phone number is not yet verified.',
        )

    salt = pct_service.generate_salt()
    token_hash = pct_service.hash_pct(payload.pct, salt)

    existing_pct = db.query(PaymentConfirmationToken).filter(PaymentConfirmationToken.user_id == user.id).first()
    if existing_pct:
        existing_pct.token_hash = token_hash
        existing_pct.token_salt = salt
    else:
        db.add(PaymentConfirmationToken(user_id=user.id, token_hash=token_hash, token_salt=salt))

    db.commit()

    return SetPCTResponse(message='Payment Confirmation Token set successfully. Registration complete.')
