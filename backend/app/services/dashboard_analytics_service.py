import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import and_, extract, func, select
from sqlalchemy.orm import Session

from app.models import Budget, Transaction
from app.schemas import (
    BudgetProgress,
    CategoryDistribution,
    DashboardSummary,
    SpendingInsight,
    TransactionPublic,
)
from app.services.budget_service import BudgetService


class DashboardAnalyticsService:
    @staticmethod
    def get_dashboard_summary(
        session: Session, user_id: uuid.UUID, month: int, year: int
    ) -> DashboardSummary:
        
        # 1. Monthly Income & Expense
        monthly_stmt = select(
            Transaction.type, func.sum(Transaction.amount)
        ).where(
            and_(
                Transaction.owner_id == user_id,
                extract("month", Transaction.transaction_date) == month,
                extract("year", Transaction.transaction_date) == year,
            )
        ).group_by(Transaction.type)
        
        monthly_results = session.execute(monthly_stmt).all()
        monthly_income = Decimal("0.0")
        monthly_expense = Decimal("0.0")
        
        for tx_type, total in monthly_results:
            if tx_type == "income":
                monthly_income = total
            else:
                monthly_expense = total

        # 2. Total Income & Expense (All time)
        total_stmt = select(
            Transaction.type, func.sum(Transaction.amount), func.count(Transaction.id)
        ).where(Transaction.owner_id == user_id).group_by(Transaction.type)
        
        total_results = session.execute(total_stmt).all()
        total_income = Decimal("0.0")
        total_expense = Decimal("0.0")
        total_transactions = 0
        
        for tx_type, total, count in total_results:
            total_transactions += count
            if tx_type == "income":
                total_income = total
            else:
                total_expense = total

        # Net Cash Flow
        net_cash_flow = monthly_income - monthly_expense
        if net_cash_flow >= 0:
            net_cash_flow_helper = f"You saved ₹{net_cash_flow:,.2f} this month."
        else:
            net_cash_flow_helper = f"You spent ₹{abs(net_cash_flow):,.2f} more than you earned this month."

        # 3. Category Distribution (Donut Chart for Expenses)
        cat_stmt = select(
            Transaction.category, func.sum(Transaction.amount)
        ).where(
            and_(
                Transaction.owner_id == user_id,
                Transaction.type == "expense",
                extract("month", Transaction.transaction_date) == month,
                extract("year", Transaction.transaction_date) == year,
            )
        ).group_by(Transaction.category).order_by(func.sum(Transaction.amount).desc())
        
        cat_results = session.execute(cat_stmt).all()
        category_distribution = []
        for cat, amount in cat_results:
            percentage = float((amount / monthly_expense) * 100) if monthly_expense > 0 else 0.0
            category_distribution.append(
                CategoryDistribution(category=cat, amount=amount, percentage=percentage)
            )

        # 4. Monthly Budget Overview
        budgets = session.scalars(
            select(Budget).where(
                and_(
                    Budget.owner_id == user_id,
                    Budget.month == month,
                    Budget.year == year,
                )
            ).order_by(Budget.category)
        ).all()
        
        budget_overview = []
        for b in budgets:
            # We can use the cat_results we already fetched for performance!
            spent = Decimal("0.0")
            for cat, amount in cat_results:
                if cat == b.category:
                    spent = amount
                    break
            
            budget_overview.append(BudgetService.get_progress(session, b, spent))

        # 5. Smart Insights (Overall user insights, e.g. from recent large expenses)
        # We can implement a simplified version here by running insights on the most recent 5 transactions
        recent_txs = session.scalars(
            select(Transaction)
            .where(and_(Transaction.owner_id == user_id, Transaction.type == "expense"))
            .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
            .limit(5)
        ).all()
        
        smart_insights = []
        from app.services.spending_insight_service import SpendingInsightService
        
        for tx in recent_txs:
            cat_insight = SpendingInsightService.check_category_anomaly(session, user_id, tx.category, tx.amount, exclude_tx_id=tx.id)
            if cat_insight and not any(i.message == cat_insight.message for i in smart_insights):
                smart_insights.append(cat_insight)
                
        # 5b. Budget Warnings
        for b in budget_overview:
            if b.status == "EXCEEDED":
                smart_insights.append(SpendingInsight(type="BUDGET_WARNING", message=f"⚠️ You exceeded your {b.category} budget by ₹{abs(Decimal(b.remaining)):.2f}."))
            elif b.status == "WARNING":
                smart_insights.append(SpendingInsight(type="BUDGET_WARNING", message=f"⚠️ You have used {b.progress_percentage:.0f}% of your {b.category} budget."))
                
        # 5c. Top Category Insight
        if category_distribution and len(category_distribution) > 0:
            top_cat = category_distribution[0]
            if top_cat.percentage > 0:
                smart_insights.append(SpendingInsight(type="TOP_CATEGORY", message=f"💡 {top_cat.category} is your highest expense category this month, making up {top_cat.percentage:.0f}% of your spending."))

        # 6. Latest Transactions
        latest_txs = session.scalars(
            select(Transaction)
            .where(Transaction.owner_id == user_id)
            .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
            .limit(10)
        ).all()
        
        latest_transactions = [
            TransactionPublic.model_validate(tx) for tx in latest_txs
        ]

        return DashboardSummary(
            total_income=total_income,
            total_expense=total_expense,
            net_cash_flow=net_cash_flow,
            net_cash_flow_helper=net_cash_flow_helper,
            total_transactions=total_transactions,
            monthly_income=monthly_income,
            monthly_expense=monthly_expense,
            budget_overview=budget_overview,
            category_distribution=category_distribution,
            latest_transactions=latest_transactions,
            smart_insights=smart_insights,
        )
