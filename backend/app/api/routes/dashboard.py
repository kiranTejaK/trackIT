"""
Dashboard summary endpoint with Redis caching.
Cache TTL: 5 minutes. Invalidated on any transaction mutation.
"""
import json
from datetime import datetime

import structlog
from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, SessionDep
from app.core.redis_client import redis_client
from app.schemas import DashboardSummary
from app.services.dashboard_analytics_service import DashboardAnalyticsService

logger = structlog.get_logger()

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

_CACHE_KEY = "dashboard:summary"
_CACHE_TTL = 300  # seconds


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    month: int | None = Query(None),
    year: int | None = Query(None),
) -> DashboardSummary:
    now = datetime.utcnow()
    m = month or now.month
    y = year or now.year

    # Attempt cache hit (keyed per user + month/year)
    cache_key = f"{_CACHE_KEY}:{current_user.id}:{y}:{m}"
    cached = await redis_client.get(cache_key)
    if cached:
        logger.debug("dashboard_cache_hit", user_id=str(current_user.id))
        return DashboardSummary.model_validate_json(cached)

    summary = DashboardAnalyticsService.get_dashboard_summary(
        session=session, user_id=current_user.id, month=m, year=y
    )
    await redis_client.setex(cache_key, _CACHE_TTL, summary.model_dump_json())
    logger.info("dashboard_computed", user_id=str(current_user.id))
    return summary
