"""
Transaction CRUD endpoints.
Cache invalidation happens on every mutating operation.
"""
import uuid
from datetime import date

import structlog
from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import CurrentUser, SessionDep
from app.core.redis_client import redis_client
from app.crud import (
    create_transaction,
    delete_transaction,
    get_transaction,
    list_transactions,
    update_transaction,
)
from app.schemas import (
    Message,
    TransactionCreate,
    TransactionPublic,
    TransactionsPublic,
    TransactionUpdate,
    TransactionWithInsights,
)

logger = structlog.get_logger()

router = APIRouter(prefix="/transactions", tags=["transactions"])


async def _invalidate_caches(user_id: uuid.UUID) -> None:
    """Remove all summary caches for a user after any transaction mutation."""
    patterns = [
        f"dashboard:summary:{user_id}:*",
        f"summary:categories:{user_id}:*",
    ]
    for pattern in patterns:
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)


@router.post("/", response_model=TransactionWithInsights, status_code=status.HTTP_201_CREATED)
async def create_transaction_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    tx_in: TransactionCreate,
) -> TransactionWithInsights:
    # First, get insights *before* committing the transaction to avoid skewing the average
    insights = []
    budget_notifications = []

    if tx_in.type == "expense":
        from app.services.spending_insight_service import SpendingInsightService
        insights = SpendingInsightService.analyze_transaction(
            session, current_user.id, tx_in.category, tx_in.amount
        )

    db_tx = create_transaction(session=session, tx_in=tx_in, owner_id=current_user.id)
    await _invalidate_caches(current_user.id)

    logger.info(
        "transaction_created",
        user_id=str(current_user.id),
        transaction_id=str(db_tx.id),
        type=db_tx.type,
        amount=str(db_tx.amount),
        category=db_tx.category,
    )

    if db_tx.type == "expense":
        from app.services.budget_service import BudgetService
        # Check budget notifications
        budget = BudgetService.get_by_category_month(
            session, current_user.id, db_tx.category, db_tx.transaction_date.month, db_tx.transaction_date.year
        )
        if budget:
            progress = BudgetService.get_progress(session, budget)
            if progress.status == "EXCEEDED":
                budget_notifications.append(f"You exceeded your {db_tx.category} budget by ₹{abs(progress.remaining):.2f}.")
            elif progress.status == "LIMIT_REACHED":
                budget_notifications.append(f"You have reached your {db_tx.category} budget.")
            elif progress.status == "WARNING":
                budget_notifications.append(f"You have used {progress.progress_percentage:.0f}% of your {db_tx.category} budget.")

    return TransactionWithInsights(
        transaction=TransactionPublic.model_validate(db_tx),
        insights=insights,
        budget_notifications=budget_notifications,
    )


@router.get("/", response_model=TransactionsPublic)
def list_transactions_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    type: str | None = Query(default=None, pattern="^(income|expense)$"),
    category: str | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
) -> TransactionsPublic:
    rows, count = list_transactions(
        session=session,
        owner_id=current_user.id,
        skip=skip,
        limit=limit,
        type_filter=type,
        category_filter=category,
        date_from=date_from,
        date_to=date_to,
    )
    return TransactionsPublic(
        data=[TransactionPublic.model_validate(r) for r in rows],
        count=count,
    )


@router.get("/{transaction_id}", response_model=TransactionPublic)
def get_transaction_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    transaction_id: uuid.UUID,
) -> TransactionPublic:
    db_tx = get_transaction(
        session=session, transaction_id=transaction_id, owner_id=current_user.id
    )
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionPublic.model_validate(db_tx)


@router.put("/{transaction_id}", response_model=TransactionPublic)
async def update_transaction_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    transaction_id: uuid.UUID,
    tx_in: TransactionUpdate,
) -> TransactionPublic:
    db_tx = get_transaction(
        session=session, transaction_id=transaction_id, owner_id=current_user.id
    )
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    updated = update_transaction(session=session, db_tx=db_tx, tx_in=tx_in)
    await _invalidate_caches(current_user.id)

    logger.info(
        "transaction_updated",
        user_id=str(current_user.id),
        transaction_id=str(updated.id),
    )
    return TransactionPublic.model_validate(updated)


@router.delete("/{transaction_id}", response_model=Message)
async def delete_transaction_endpoint(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    transaction_id: uuid.UUID,
) -> Message:
    db_tx = get_transaction(
        session=session, transaction_id=transaction_id, owner_id=current_user.id
    )
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    delete_transaction(session=session, db_tx=db_tx)
    await _invalidate_caches(current_user.id)

    logger.info(
        "transaction_deleted",
        user_id=str(current_user.id),
        transaction_id=str(transaction_id),
    )
    return Message(message="Transaction deleted successfully")
