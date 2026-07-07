import re

from pydantic import BaseModel, field_validator


class RegisterRequest(BaseModel):
    phone_number: str
    first_name: str
    last_name: str
    email: str
    date_of_birth: str
    address: str
    gender: str
    account_number: str
    bank_code: str
    geo_lat: float
    geo_lng: float

    @field_validator('phone_number')
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r'^\+234\d{10}$', v):
            raise ValueError('phone_number must be in E.164 format: +234XXXXXXXXXX')
        return v

    @field_validator('account_number')
    @classmethod
    def validate_account_number(cls, v: str) -> str:
        if not re.match(r'^\d{10}$', v):
            raise ValueError('account_number must be exactly 10 digits')
        return v

    @field_validator('gender')
    @classmethod
    def validate_gender(cls, v: str) -> str:
        if v not in ('1', '2'):
            raise ValueError("gender must be '1' (Male) or '2' (Female)")
        return v

    @field_validator('date_of_birth')
    @classmethod
    def validate_dob(cls, v: str) -> str:
        if not re.match(r'^\d{2}/\d{2}/\d{4}$', v):
            raise ValueError('date_of_birth must be in DD/MM/YYYY format')
        return v


class RegisterResponse(BaseModel):
    message: str
    phone_number: str


class ResendOTPRequest(BaseModel):
    phone_number: str


class ResendOTPResponse(BaseModel):
    message: str


class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp: str

    @field_validator('otp')
    @classmethod
    def validate_otp(cls, v: str) -> str:
        if not re.match(r'^\d{6}$', v):
            raise ValueError('otp must be exactly 6 digits')
        return v


class WalletDetails(BaseModel):
    balance: str  # Decimal serialised as string to avoid float precision issues
    currency: str


class VerifyOTPResponse(BaseModel):
    message: str
    wallet: WalletDetails
    twilio_join_code: str
    twilio_whatsapp_number: str
    next_step: str


class SetPCTRequest(BaseModel):
    phone_number: str
    pct: str  # 4–8 character alphanumeric PIN

    @field_validator('pct')
    @classmethod
    def validate_pct(cls, v: str) -> str:
        if not re.match(r'^[A-Za-z0-9]{4,8}$', v):
            raise ValueError('pct must be 4–8 alphanumeric characters')
        return v


class SetPCTResponse(BaseModel):
    message: str
