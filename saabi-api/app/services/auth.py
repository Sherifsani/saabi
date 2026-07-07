"""
Lightweight auth dependency for the REST surface.

The WhatsApp bot authenticates users by their verified phone number, and the
public discovery endpoints are intentionally open for the hackathon demo, so
this dependency resolves to an anonymous (``None``) user unless a future
token-based scheme is added. It exists so routers can declare an optional
``current_user`` without importing heavyweight auth machinery.
"""

from __future__ import annotations

from typing import Optional

from app.models.user import User


def get_current_user() -> Optional[User]:
    """Return the authenticated user, or ``None`` for anonymous callers."""
    return None
