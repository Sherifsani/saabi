"""
Service Discovery API — find and register informal workers/traders.

Endpoints:
- POST /discovery/search     → Search for providers by service + location
- POST /discovery/register   → Register as a service provider
- GET  /discovery/categories → List all service categories
- GET  /discovery/worker/{id}  → Get provider details
- POST /discovery/rate         → Submit a rating for a provider
"""

from __future__ import annotations

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.worker import Worker
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/discovery", tags=["Service Discovery"])


# ── Request / Response Models ─────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str = Field(..., description="Natural language query e.g. 'plumber in Ikeja'")
    lga: Optional[str] = None
    category: Optional[str] = None
    limit: int = Field(default=10, le=50)


class WorkerResponse(BaseModel):
    id: str
    full_name: str
    phone_number: str
    service_category: str
    service_description: Optional[str]
    base_rate: Optional[str]
    lga: str
    state: str
    rating: float
    review_count: int
    is_verified: bool
    is_available: bool
    credibility_score: float

    class Config:
        from_attributes = True

    @field_validator('id', mode='before')
    @classmethod
    def _coerce_id(cls, v: object) -> str:
        # ORM hands back a UUID; the response contract is a string.
        return str(v)


class RegisterWorkerRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    phone_number: str = Field(..., pattern=r'^\+?234\d{10}$')
    email: Optional[str] = None
    service_category: str = Field(..., min_length=2)
    service_description: Optional[str] = None
    base_rate: Optional[str] = None
    lga: str = Field(..., min_length=2)
    state: str = Field(default="Lagos")
    geo_lat: Optional[float] = None
    geo_lng: Optional[float] = None


class RateWorkerRequest(BaseModel):
    worker_id: str
    rating: float = Field(..., ge=1, le=5)
    review: Optional[str] = None


# ── Service Categories ──────────────────────────────────────────────

SERVICE_CATEGORIES = [
    "Plumbing",
    "Electrical",
    "Carpentry",
    "Food Delivery",
    "Generator Repair",
    "Phone Repair",
    "Tailoring",
    "Hairdressing",
    "Logistics",
    "Cleaning",
    "Painting",
    "Welding",
    "Auto Mechanic",
    "Photography",
    "Event Planning",
    "Tutoring",
    "Fruit Vendor",
    "Vegetable Vendor",
    "Clothing Vendor",
    "Electronics Vendor",
    "Handyman Services",
    "Laundry Services",
    "Courier Services",
    "Gardening Services",
    "Cleaning Services",
    "Construction Services",
    "Tech Support",
    "Other"
]


# ── Endpoints ───────────────────────────────────────────────────────

@router.post("/search", response_model=list[WorkerResponse])
def search_workers(
    request: SearchRequest,
    db: Session = Depends(get_db),
):
    """Search for service providers by query, category, or LGA."""
    query = db.query(Worker).filter(Worker.is_available == True)

    if request.category:
        query = query.filter(Worker.service_category.ilike(f"%{request.category}%"))

    if request.lga:
        query = query.filter(Worker.lga.ilike(f"%{request.lga}%"))

    # If no filters, search by query text across name, category, description
    if not request.category and not request.lga and request.query:
        search_term = f"%{request.query}%"
        query = query.filter(
            Worker.full_name.ilike(search_term) |
            Worker.service_category.ilike(search_term) |
            Worker.service_description.ilike(search_term) |
            Worker.lga.ilike(search_term)
        )

    # Order by rating and credibility
    workers = (
        query.order_by(Worker.rating.desc(), Worker.credibility_score.desc())
        .limit(request.limit)
        .all()
    )

    return workers


@router.post("/register", response_model=WorkerResponse)
def register_worker(
    request: RegisterWorkerRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user),
):
    """Register as a service provider / informal trader."""
    # Check if phone already registered
    existing = db.query(Worker).filter(Worker.phone_number == request.phone_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered as a provider")

    worker = Worker(
        user_id=current_user.id if current_user else None,
        full_name=request.full_name,
        phone_number=request.phone_number,
        email=request.email,
        service_category=request.service_category,
        service_description=request.service_description,
        base_rate=request.base_rate,
        lga=request.lga,
        state=request.state,
        geo_lat=request.geo_lat,
        geo_lng=request.geo_lng,
        is_verified=False,
        credibility_score=50.0,  # Starting score
        rating=5.0,
        review_count=0,
        is_available=True,
    )

    db.add(worker)
    db.commit()
    db.refresh(worker)

    return worker


@router.get("/categories")
def get_categories():
    """Get all available service categories."""
    return {"categories": SERVICE_CATEGORIES}


@router.get("/worker/{worker_id}", response_model=WorkerResponse)
def get_worker(worker_id: str, db: Session = Depends(get_db)):
    """Get detailed info about a specific provider."""
    worker = db.query(Worker).filter(Worker.id == uuid.UUID(worker_id)).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker


@router.get("/nearby")
def find_nearby(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius_km: float = Query(default=10.0, description="Search radius in km"),
    category: Optional[str] = None,
    limit: int = Query(default=10, le=50),
    db: Session = Depends(get_db),
):
    """Find providers within a radius using Haversine formula."""
    # Simplified: filter by bounding box first, then calculate distance
    from math import radians, cos, sin, asin, sqrt

    def haversine(lat1, lon1, lat2, lon2):
        R = 6371  # Earth radius in km
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        return 2 * R * asin(sqrt(a))

    # Approximate degree offsets
    lat_offset = radius_km / 111
    lng_offset = radius_km / (111 * cos(radians(lat)))

    query = db.query(Worker).filter(
        Worker.is_available == True,
        Worker.geo_lat.between(lat - lat_offset, lat + lat_offset),
        Worker.geo_lng.between(lng - lng_offset, lng + lng_offset),
    )

    if category:
        query = query.filter(Worker.service_category.ilike(f"%{category}%"))

    candidates = query.all()

    # Calculate exact distances and filter
    results = []
    for worker in candidates:
        if worker.geo_lat and worker.geo_lng:
            dist = haversine(lat, lng, worker.geo_lat, worker.geo_lng)
            if dist <= radius_km:
                results.append({
                    "worker": WorkerResponse.model_validate(worker),
                    "distance_km": round(dist, 2),
                })

    # Sort by distance
    results.sort(key=lambda x: x["distance_km"])
    return results[:limit]


@router.post("/rate")
def rate_worker(
    request: RateWorkerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a rating for a service provider."""
    worker = db.query(Worker).filter(Worker.id == uuid.UUID(request.worker_id)).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Update weighted average
    total_score = (worker.rating * worker.review_count) + request.rating
    worker.review_count += 1
    worker.rating = round(total_score / worker.review_count, 2)

    # Boost credibility for verified ratings
    if current_user and current_user.phone_verified:
        worker.credibility_score = min(100, worker.credibility_score + 2)

    db.commit()
    db.refresh(worker)

    return {
        "message": "Rating submitted successfully",
        "new_rating": worker.rating,
        "review_count": worker.review_count,
    }


@router.get("/trending")
def get_trending_services(db: Session = Depends(get_db)):
    """Get trending service categories based on provider count."""
    from sqlalchemy import func

    results = (
        db.query(Worker.service_category, func.count(Worker.id).label("count"))
        .filter(Worker.is_available == True)
        .group_by(Worker.service_category)
        .order_by(func.count(Worker.id).desc())
        .limit(10)
        .all()
    )

    return [{"category": r[0], "provider_count": r[1]} for r in results]