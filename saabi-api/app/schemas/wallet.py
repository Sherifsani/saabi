from decimal import Decimal

from pydantic import BaseModel, field_validator


class FundWalletInitRequest(BaseModel):
    phone_number: str
    amount: Decimal  # NGN

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError('amount must be greater than zero')
        # Squad works in kobo, so anything past 2 decimal places can't be charged.
        if v.as_tuple().exponent < -2:  # type: ignore[operator]
            raise ValueError('amount cannot have more than 2 decimal places')
        return v


class FundWalletInitResponse(BaseModel):
    # Everything the frontend needs to open Squad's payment modal.
    reference: str
    amount: str  # Decimal serialised as string to avoid float precision issues
    amount_kobo: int  # Squad's modal expects the amount in kobo
    currency: str
    email: str
