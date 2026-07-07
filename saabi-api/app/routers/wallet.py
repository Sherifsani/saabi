import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import load_database
from app.models.user import User
from app.schemas.wallet import FundWalletInitRequest, FundWalletInitResponse
from app.services import funding as funding_service

router = APIRouter(prefix='/wallet', tags=['wallet'])
logger = logging.getLogger(__name__)


@router.post('/fund/init', response_model=FundWalletInitResponse, status_code=status.HTTP_201_CREATED)
def fund_init(payload: FundWalletInitRequest, db: Session = Depends(load_database)):
    """Start a wallet top-up.

    We don't move any money here — we just record a PENDING funding row and
    hand its reference to the frontend. The frontend opens Squad's payment
    modal with it, and the wallet is only credited later, when Squad's
    collection webhook confirms the charge.
    """
    user: User | None = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found.')

    if not user.phone_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail='Phone number is not yet verified.',
        )

    funding = funding_service.initiate(db, user, payload.amount)
    logger.info('Funding initiated for %s: ref=%s amount=%s', user.phone_number, funding.reference, funding.amount)

    return FundWalletInitResponse(
        reference=funding.reference,
        amount=str(funding.amount),
        amount_kobo=int((funding.amount * 100).to_integral_value()),
        currency=funding.currency,
        email=user.email,
    )
