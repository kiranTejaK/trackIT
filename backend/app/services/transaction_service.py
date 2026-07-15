"""
Transaction service — aggregation, dashboard computation, and summary logic.
All database queries are here; routes stay thin.
"""
import uuid
from decimal import Decimal

from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from app.models import Transaction
from app.schemas import (
    CategorySummary,
    MonthlySummary,
    TransactionPublic,
)


def _to_decimal(value: float | Decimal | None) -> Decimal:
    if value is None:
        return Decimal("0.00")
    return Decimal(str(value)).quantize(Decimal("0.01"))


def get_monthly_summary(
    *, session: Session, owner_id: uuid.UUID, year: int, month: int
) -> MonthlySummary:
    """Income/expense summary for a specific month."""

    def _monthly_sum(tx_type: str) -> Decimal:
        stmt = select(func.sum(Transaction.amount)).where(
            Transaction.owner_id == owner_id,
            Transaction.type == tx_type,
            extract("month", Transaction.transaction_date) == month,
            extract("year", Transaction.transaction_date) == year,
        )
        return _to_decimal(session.execute(stmt).scalar())

    income = _monthly_sum("income")
    expense = _monthly_sum("expense")

    count_stmt = select(func.count(Transaction.id)).where(
        Transaction.owner_id == owner_id,
        extract("month", Transaction.transaction_date) == month,
        extract("year", Transaction.transaction_date) == year,
    )
    count = session.execute(count_stmt).scalar() or 0

    return MonthlySummary(
        year=year,
        month=month,
        total_income=income,
        total_expense=expense,
        balance=income - expense,
        transaction_count=count,
    )


def get_category_summary(
    *, session: Session, owner_id: uuid.UUID, type_filter: str | None = None
) -> list[CategorySummary]:
    """Category breakdown with percentage share."""
    stmt = select(
        Transaction.category,
        func.sum(Transaction.amount),
        func.count(Transaction.id),
    ).where(Transaction.owner_id == owner_id)

    if type_filter:
        stmt = stmt.where(Transaction.type == type_filter)

    stmt = stmt.group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc())
    rows = session.execute(stmt).all()

    grand_total = sum(_to_decimal(row[1]) for row in rows) or Decimal("1")
    return [
        CategorySummary(
            category=row[0],
            total=_to_decimal(row[1]),
            count=row[2],
            percentage=float(_to_decimal(row[1]) / grand_total * 100),
        )
        for row in rows
    ]


def get_recent_transactions(
    *, session: Session, owner_id: uuid.UUID, limit: int = 10
) -> list[TransactionPublic]:
    """Fetch the most recent N transactions."""
    stmt = (
        select(Transaction)
        .where(Transaction.owner_id == owner_id)
        .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
        .limit(limit)
    )
    rows = session.execute(stmt).scalars().all()
    return [TransactionPublic.model_validate(tx) for tx in rows]
