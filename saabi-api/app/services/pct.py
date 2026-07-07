"""
Payment Confirmation Token (PCT) hashing utilities.

Uses PBKDF2-HMAC-SHA256 with a per-user salt so that two users who happen
to pick the same PIN produce different stored hashes.
"""

import hashlib
import os


def generate_salt() -> str:
    return os.urandom(32).hex()


def hash_pct(pct: str, salt: str) -> str:
    dk = hashlib.pbkdf2_hmac('sha256', pct.encode(), salt.encode(), 200_000)
    return dk.hex()


def verify_pct(pct: str, salt: str, stored_hash: str) -> bool:
    return hash_pct(pct, salt) == stored_hash