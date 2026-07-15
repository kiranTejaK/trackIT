import uuid
from collections.abc import Sequence
from decimal import Decimal

from sqlalchemy import and_, extract, func, select
from sqlalchemy.orm import Session

from app.models import Budget, Transaction
from app.schemas import BudgetCreate, BudgetProgress, BudgetStatus, BudgetUpdate


class BudgetService:
    @staticmethod
    def calculate_status(spent: Decimal, limit: Decimal) -> BudgetStatus:
        if limit == 0:
            return "EXCEEDED" if spent > 0 else "SAFE"

        ratio = spent / limit
        if ratio >= 1.0:
            if ratio == 1.0:
                return "LIMIT_REACHED"
            return "EXCEEDED"
        if ratio >= Decimal("0.8"):
            return "WARNING"
        return "SAFE"

    @staticmethod
    def get_progress(
        session: Session, budget: Budget, current_month_spent: Decimal | None = None
    ) -> BudgetProgress:
        if current_month_spent is None:
            # Calculate spent for this budget's category, month, and year
            spent_scalar = session.scalar(
                select(func.sum(Transaction.amount)).where(
                    and_(
                        Transaction.owner_id == budget.owner_id,
                        Transaction.category == budget.category,
                        Transaction.type == "expense",
                        extract("month", Transaction.transaction_date) == budget.month,
                        extract("year", Transaction.transaction_date) == budget.year,
                    )
                )
            )
            spent = spent_scalar or Decimal("0.0")
        else:
            spent = current_month_spent

        remaining = budget.monthly_limit - spent
        if budget.monthly_limit > 0:
            progress_percentage = float((spent / budget.monthly_limit) * 100)
        else:
            progress_percentage = 100.0 if spent > 0 else 0.0

        return BudgetProgress(
            id=budget.id,
            category=budget.category,
            monthly_limit=budget.monthly_limit,
            spent=spent,
            remaining=remaining,
            progress_percentage=min(progress_percentage, 100.0), # Cap at 100 for UI bars if needed, or leave actual
            status=BudgetService.calculate_status(spent, budget.monthly_limit),
            month=budget.month,
            year=budget.year,
        )

    @staticmethod
    def create(session: Session, user_id: uuid.UUID, data: BudgetCreate) -> Budget:
        db_budget = Budget(
            owner_id=user_id,
            category=data.category,
            monthly_limit=data.monthly_limit,
            month=data.month,
            year=data.year,
        )
        session.add(db_budget)
        session.commit()
        session.refresh(db_budget)
        return db_budget

    @staticmethod
    def get(session: Session, budget_id: uuid.UUID, user_id: uuid.UUID) -> Budget | None:
        return session.scalar(
            select(Budget).where(and_(Budget.id == budget_id, Budget.owner_id == user_id))
        )

    @staticmethod
    def get_by_category_month(
        session: Session, user_id: uuid.UUID, category: str, month: int, year: int
    ) -> Budget | None:
        return session.scalar(
            select(Budget).where(
                and_(
                    Budget.owner_id == user_id,
                    Budget.category == category,
                    Budget.month == month,
                    Budget.year == year,
                )
            )
        )

    @staticmethod
    def get_all(
        session: Session, user_id: uuid.UUID, month: int, year: int
    ) -> Sequence[Budget]:
        return session.scalars(
            select(Budget).where(
                and_(
                    Budget.owner_id == user_id,
                    Budget.month == month,
                    Budget.year == year,
                )
            ).order_by(Budget.category)
        ).all()

    @staticmethod
    def update(session: Session, budget: Budget, data: BudgetUpdate) -> Budget:
        budget.monthly_limit = data.monthly_limit
        session.add(budget)
        session.commit()
        session.refresh(budget)
        return budget

    @staticmethod
    def delete(session: Session, budget: Budget) -> None:
        session.delete(budget)
        session.commit()
