import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.redis_client import redis_client
from app.models import User
from app.schemas import BudgetCreate, BudgetProgress, BudgetUpdate
from app.services.budget_service import BudgetService

router = APIRouter()


async def _invalidate_caches(user_id: uuid.UUID) -> None:
    patterns = [
        f"dashboard:summary:{user_id}:*",
        f"summary:categories:{user_id}:*",
    ]
    for pattern in patterns:
        keys = await redis_client.keys(pattern)
        if keys:
            await redis_client.delete(*keys)


@router.post("/", response_model=BudgetProgress, status_code=status.HTTP_201_CREATED)
async def create_budget(
    *,
    db: Session = Depends(get_db),
    budget_in: BudgetCreate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Create new budget.
    """
    existing_budget = BudgetService.get_by_category_month(
        db, current_user.id, budget_in.category, budget_in.month, budget_in.year
    )
    if existing_budget:
        raise HTTPException(
            status_code=400,
            detail="A budget for this category and month already exists.",
        )

    try:
        budget = BudgetService.create(db, current_user.id, budget_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="A budget for this category and month already exists.",
        )

    await _invalidate_caches(current_user.id)
    return BudgetService.get_progress(db, budget)


@router.get("/", response_model=list[BudgetProgress])
def read_budgets(
    *,
    db: Session = Depends(get_db),
    month: int,
    year: int,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Retrieve budgets for a specific month and year.
    """
    budgets = BudgetService.get_all(db, current_user.id, month, year)
    return [BudgetService.get_progress(db, b) for b in budgets]


@router.put("/{budget_id}", response_model=BudgetProgress)
async def update_budget(
    *,
    db: Session = Depends(get_db),
    budget_id: uuid.UUID,
    budget_in: BudgetUpdate,
    current_user: User = Depends(get_current_user),
) -> Any:
    """
    Update a budget.
    """
    budget = BudgetService.get(db, budget_id, current_user.id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    budget = BudgetService.update(db, budget, budget_in)
    await _invalidate_caches(current_user.id)
    return BudgetService.get_progress(db, budget)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    *,
    db: Session = Depends(get_db),
    budget_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
) -> None:
    """
    Delete a budget.
    """
    budget = BudgetService.get(db, budget_id, current_user.id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    BudgetService.delete(db, budget)
    await _invalidate_caches(current_user.id)
