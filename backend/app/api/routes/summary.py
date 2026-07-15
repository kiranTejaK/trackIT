"""
Summary endpoints: monthly, category breakdown, and recent transactions.
Category summary is cached per user + type filter.
"""
from datetime import datetime

import structlog
from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, SessionDep
from app.core.redis_client import redis_client
from app.schemas import CategorySummary, MonthlySummary, TransactionPublic
from app.services import transaction_service

logger = structlog.get_logger()

router = APIRouter(prefix="/summary", tags=["summary"])

_CAT_CACHE_TTL = 300  # 5 minutes


@router.get("/monthly", response_model=MonthlySummary)
def get_monthly_summary(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    year: int = Query(default=None),
    month: int = Query(default=None, ge=1, le=12),
) -> MonthlySummary:
    now = datetime.utcnow()
    resolved_year = year or now.year
    resolved_month = month or now.month

    return transaction_service.get_monthly_summary(
        session=session,
        owner_id=current_user.id,
        year=resolved_year,
        month=resolved_month,
    )


@router.get("/categories", response_model=list[CategorySummary])
async def get_category_summary(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    type: str | None = Query(default=None, pattern="^(income|expense)$"),
) -> list[CategorySummary]:
    cache_key = f"summary:categories:{current_user.id}:{type or 'all'}"
    cached = await redis_client.get(cache_key)
    if cached:
        import json
        raw = json.loads(cached)
        return [CategorySummary.model_validate(item) for item in raw]

    result = transaction_service.get_category_summary(
        session=session, owner_id=current_user.id, type_filter=type
    )
    await redis_client.setex(
        cache_key,
        _CAT_CACHE_TTL,
        __import__("json").dumps([item.model_dump() for item in result], default=str),
    )
    return result


@router.get("/recent", response_model=list[TransactionPublic])
def get_recent_transactions(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    limit: int = Query(default=10, ge=1, le=50),
) -> list[TransactionPublic]:
    return transaction_service.get_recent_transactions(
        session=session, owner_id=current_user.id, limit=limit
    )
