import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "user"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    transactions: Mapped[list["Transaction"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )
    budgets: Mapped[list["Budget"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan"
    )


class Transaction(Base):
    __tablename__ = "transaction"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    type: Mapped[str] = mapped_column(String(10), nullable=False)  # "income" | "expense"
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    transaction_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"), nullable=False
    )

    owner: Mapped[Optional["User"]] = relationship(back_populates="transactions")


class Budget(Base):
    __tablename__ = "budget"

    __table_args__ = (
        UniqueConstraint(
            "owner_id", "category", "month", "year",
            name="uq_budget_user_cat_month",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"), nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    monthly_limit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    owner: Mapped[Optional["User"]] = relationship(back_populates="budgets")

