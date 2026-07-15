import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Auth Schemas (kept from template)
# ---------------------------------------------------------------------------

class UserBase(BaseSchema):
    email: EmailStr = Field(max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(BaseSchema):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(BaseSchema):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(BaseSchema):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(BaseSchema):
    data: list[UserPublic]
    count: int


# ---------------------------------------------------------------------------
# Transaction Schemas
# ---------------------------------------------------------------------------

TransactionType = Literal["income", "expense"]

INCOME_CATEGORIES = ["Salary", "Freelance", "Bonus", "Interest", "Other Income"]
EXPENSE_CATEGORIES = [
    "Food",
    "Travel",
    "Shopping",
    "Entertainment",
    "Bills",
    "Health",
    "Education",
    "Miscellaneous",
]
ALL_CATEGORIES = INCOME_CATEGORIES + EXPENSE_CATEGORIES


class TransactionBase(BaseSchema):
    amount: Decimal = Field(gt=0, decimal_places=2, description="Must be greater than 0")
    type: TransactionType
    category: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    transaction_date: date


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseSchema):
    amount: Decimal | None = Field(default=None, gt=0, decimal_places=2)
    type: TransactionType | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    transaction_date: date | None = None


class TransactionPublic(TransactionBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime


class TransactionsPublic(BaseSchema):
    data: list[TransactionPublic]
    count: int


# ---------------------------------------------------------------------------
# Budget Schemas
# ---------------------------------------------------------------------------

BudgetStatus = Literal["SAFE", "WARNING", "LIMIT_REACHED", "EXCEEDED"]


class BudgetCreate(BaseSchema):
    category: str = Field(min_length=1, max_length=100)
    monthly_limit: Decimal = Field(gt=0, decimal_places=2)
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2000, le=2100)


class BudgetUpdate(BaseSchema):
    monthly_limit: Decimal = Field(gt=0, decimal_places=2)


class BudgetPublic(BaseSchema):
    id: uuid.UUID
    category: str
    monthly_limit: Decimal
    month: int
    year: int
    created_at: datetime
    updated_at: datetime


class BudgetProgress(BaseSchema):
    """Budget with live spending calculations."""
    id: uuid.UUID
    category: str
    monthly_limit: Decimal
    spent: Decimal
    remaining: Decimal
    progress_percentage: float
    status: BudgetStatus
    month: int
    year: int


# ---------------------------------------------------------------------------
# Smart Insights Schemas
# ---------------------------------------------------------------------------

InsightType = Literal["CATEGORY_ANOMALY", "BUDGET_WARNING", "TOP_CATEGORY"]


class SpendingInsight(BaseSchema):
    type: InsightType
    message: str


class TransactionWithInsights(BaseSchema):
    """Response returned when creating an expense transaction."""
    transaction: TransactionPublic
    insights: list[SpendingInsight]
    budget_notifications: list[str]


# ---------------------------------------------------------------------------
# Dashboard Schemas
# ---------------------------------------------------------------------------

class CategoryDistribution(BaseSchema):
    """Monthly category spending for pie/donut chart."""
    category: str
    amount: Decimal
    percentage: float


class DashboardSummary(BaseSchema):
    # Top stat cards
    total_income: Decimal
    total_expense: Decimal
    net_cash_flow: Decimal           # monthly_income - monthly_expense
    net_cash_flow_helper: str        # "You saved ₹X" or "You spent ₹X more..."
    total_transactions: int
    monthly_income: Decimal
    monthly_expense: Decimal

    # Widgets
    budget_overview: list[BudgetProgress]
    category_distribution: list[CategoryDistribution]
    latest_transactions: list[TransactionPublic]
    smart_insights: list[SpendingInsight]


class MonthlySummary(BaseSchema):
    year: int
    month: int
    total_income: Decimal
    total_expense: Decimal
    balance: Decimal
    transaction_count: int


class CategorySummary(BaseSchema):
    category: str
    total: Decimal
    count: int
    percentage: float


# ---------------------------------------------------------------------------
# Misc Schemas (kept from template)
# ---------------------------------------------------------------------------

class Message(BaseSchema):
    message: str


class Token(BaseSchema):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseSchema):
    sub: str | None = None


class NewPassword(BaseSchema):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class VerifyEmail(BaseSchema):
    token: str


