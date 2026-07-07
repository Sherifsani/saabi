"""
Service-discovery helpers for the WhatsApp bot.

Wraps the same ``Worker`` queries the REST router exposes, but returns
human-readable reply strings the Twilio webhook can echo back as TwiML.
"""

from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy.orm import Session

from app.models.user import User
from app.models.worker import Worker

logger = logging.getLogger(__name__)

_MAX_RESULTS = 5


def _normalise_category(raw: str) -> str:
    """Snap a free-text service to a canonical category when possible."""
    from app.routers.discovery import SERVICE_CATEGORIES

    lowered = raw.strip().lower()
    for category in SERVICE_CATEGORIES:
        if lowered == category.lower() or lowered in category.lower() or category.lower() in lowered:
            return category
    return raw.strip().title()


def search_reply(db: Session, category: Optional[str], lga: Optional[str]) -> str:
    """Find available providers and format them for WhatsApp."""
    query = db.query(Worker).filter(Worker.is_available.is_(True))
    if category:
        query = query.filter(Worker.service_category.ilike(f'%{category}%'))
    if lga:
        query = query.filter(Worker.lga.ilike(f'%{lga}%'))

    workers = (
        query.order_by(Worker.rating.desc(), Worker.credibility_score.desc())
        .limit(_MAX_RESULTS)
        .all()
    )

    where = f' in {lga}' if lga else ''
    what = category or 'service'
    if not workers:
        return (
            f'No available {what} providers found{where}. '
            'Try a different area or service name.'
        )

    lines = [f'{what.title()} providers{where}:']
    for w in workers:
        badge = ' ✅' if w.is_verified else ''
        rate = f' — {w.base_rate}' if w.base_rate else ''
        lines.append(
            f'• {w.full_name}{badge} ({w.service_category}, {w.lga})\n'
            f'  ⭐ {w.rating} ({w.review_count} reviews){rate}\n'
            f'  📞 {w.phone_number}'
        )
    return '\n'.join(lines)


def register_reply(
    db: Session,
    user: User,
    *,
    full_name: Optional[str],
    service_category: Optional[str],
    lga: Optional[str],
    base_rate: Optional[str],
    service_description: Optional[str],
) -> str:
    """Register (or update) the user as a service provider; return a reply."""
    if not service_category or not lga:
        return (
            'To list yourself, tell me your service and area — e.g. '
            '"register me as a plumber in Yaba, 5000/hr".'
        )

    category = _normalise_category(service_category)
    name = full_name or f'{user.first_name} {user.last_name}'.strip()

    existing = db.query(Worker).filter(Worker.phone_number == user.phone_number).first()
    if existing is not None:
        existing.full_name = name
        existing.service_category = category
        existing.lga = lga
        existing.base_rate = base_rate or existing.base_rate
        existing.service_description = service_description or existing.service_description
        existing.is_available = True
        if existing.user_id is None:
            existing.user_id = user.id
        db.commit()
        return f'Updated your listing: {category} in {lga}. Clients searching nearby can now find you.'

    worker = Worker(
        user_id=user.id,
        full_name=name,
        phone_number=user.phone_number,
        email=user.email,
        service_category=category,
        service_description=service_description,
        base_rate=base_rate,
        lga=lga,
        state='Lagos',
        geo_lat=user.geo_lat,
        geo_lng=user.geo_lng,
        is_verified=False,
        credibility_score=50.0,
        rating=5.0,
        review_count=0,
        is_available=True,
    )
    db.add(worker)
    db.commit()
    logger.info('Registered worker %s (%s in %s)', user.phone_number, category, lga)
    return (
        f'You are now listed as a {category} in {lga}. '
        'Clients searching for your service nearby will see your profile. '
        'Reply "register" again anytime to update your details.'
    )
