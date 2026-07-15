import uuid
from decimal import Decimal

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models import Transaction
from app.schemas import SpendingInsight


class SpendingInsightService:
    CATEGORY_ANOMALY_THRESHOLD = Decimal("5.0")
    OVERALL_ANOMALY_THRESHOLD = Decimal("5.0")
    MIN_HISTORY_RECORDS = 3

    @classmethod
    def check_category_anomaly(
        cls, session: Session, user_id: uuid.UUID, category: str, new_amount: Decimal, exclude_tx_id: uuid.UUID | None = None
    ) -> SpendingInsight | None:
        """
        Check if the new_amount is significantly larger than historical average for the category.
        """
        where_clause = and_(
            Transaction.owner_id == user_id,
            Transaction.type == "expense",
            Transaction.category == category,
        )
        if exclude_tx_id:
            where_clause = and_(where_clause, Transaction.id != exclude_tx_id)

        # We need average and count
        stmt = select(
            func.avg(Transaction.amount), func.count(Transaction.id)
        ).where(where_clause)
        row = session.execute(stmt).first()
        if not row:
            return None

        avg_spent, count = row
        if not count or count < cls.MIN_HISTORY_RECORDS or not avg_spent:
            return None

        if new_amount >= avg_spent * cls.CATEGORY_ANOMALY_THRESHOLD:
            return SpendingInsight(
                type="CATEGORY_ANOMALY",
                message=f"An unusually high transaction of ₹{new_amount:,.0f} was detected in your {category} category (normally averages ₹{avg_spent:,.0f}).",
            )
        return None

    @classmethod
    def analyze_transaction(
        cls, session: Session, user_id: uuid.UUID, category: str, amount: Decimal
    ) -> list[SpendingInsight]:
        """
        Run all insight checks for a new transaction.
        """
        insights = []

        cat_insight = cls.check_category_anomaly(session, user_id, category, amount)
        if cat_insight:
            insights.append(cat_insight)

        return insights
