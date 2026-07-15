"""
Notification service — checks spending thresholds and dispatches alert emails.
Reuses the existing SMTP send_email() infrastructure from utils.py.
"""
import logging
from decimal import Decimal

from app.core.config import settings
from app.models import User
from app.utils import EmailData, send_email

logger = logging.getLogger(__name__)


def _send_notification(*, email_to: str, email_data: EmailData) -> None:
    """Fire-and-forget email dispatch. Logs errors but never raises."""
    if not settings.emails_enabled:
        logger.info("Email not configured — skipping notification to %s", email_to)
        return
    try:
        send_email(
            email_to=email_to,
            subject=email_data.subject,
            html_content=email_data.html_content,
        )
        logger.info("Notification sent to %s: %s", email_to, email_data.subject)
    except Exception as exc:
        logger.error("Failed to send notification to %s: %s", email_to, exc)


def check_expense_threshold(*, user: User, amount: Decimal) -> None:
    """Send alert if a single expense exceeds the configured threshold."""
    threshold = Decimal(str(settings.EXPENSE_ALERT_THRESHOLD))
    if amount <= threshold:
        return

    logger.info(
        "Expense alert triggered for user=%s amount=%s threshold=%s",
        user.email,
        amount,
        threshold,
    )
    from app.utils import generate_expense_alert_email

    email_data = generate_expense_alert_email(
        email_to=user.email,
        user_name=user.full_name or user.email,
        amount=float(amount),
        threshold=float(threshold),
    )
    _send_notification(email_to=user.email, email_data=email_data)


def check_monthly_budget(*, user: User, month_total: Decimal) -> None:
    """Send alert if monthly expenses exceed the configured budget limit."""
    limit = Decimal(str(settings.MONTHLY_BUDGET_LIMIT))
    if month_total <= limit:
        return

    logger.info(
        "Monthly budget alert triggered for user=%s month_total=%s limit=%s",
        user.email,
        month_total,
        limit,
    )
    from app.utils import generate_monthly_budget_alert_email

    email_data = generate_monthly_budget_alert_email(
        email_to=user.email,
        user_name=user.full_name or user.email,
        month_total=float(month_total),
        budget_limit=float(limit),
    )
    _send_notification(email_to=user.email, email_data=email_data)
