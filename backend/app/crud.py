import uuid
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models import Transaction, User
from app.schemas import TransactionCreate, TransactionUpdate, UserCreate, UserUpdate

# ---------------------------------------------------------------------------
# User CRUD (kept from template)
# ---------------------------------------------------------------------------

def create_user(*, session: Session, user_create: UserCreate) -> User:
    user_data = user_create.model_dump()
    password = user_data.pop("password")
    db_obj = User(**user_data, hashed_password=get_password_hash(password))
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    if "password" in user_data:
        password = user_data.pop("password")
        user_data["hashed_password"] = get_password_hash(password)

    for key, value in user_data.items():
        setattr(db_user, key, value)

    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    return session.execute(statement).scalars().first()


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


# ---------------------------------------------------------------------------
# Transaction CRUD
# ---------------------------------------------------------------------------

def create_transaction(
    *, session: Session, tx_in: TransactionCreate, owner_id: uuid.UUID
) -> Transaction:
    db_tx = Transaction(**tx_in.model_dump(), owner_id=owner_id)
    session.add(db_tx)
    session.commit()
    session.refresh(db_tx)
    return db_tx


def get_transaction(
    *, session: Session, transaction_id: uuid.UUID, owner_id: uuid.UUID
) -> Transaction | None:
    statement = select(Transaction).where(
        Transaction.id == transaction_id, Transaction.owner_id == owner_id
    )
    return session.execute(statement).scalars().first()


def update_transaction(
    *, session: Session, db_tx: Transaction, tx_in: TransactionUpdate
) -> Transaction:
    update_data = tx_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tx, key, value)
    session.add(db_tx)
    session.commit()
    session.refresh(db_tx)
    return db_tx


def delete_transaction(*, session: Session, db_tx: Transaction) -> None:
    session.delete(db_tx)
    session.commit()


def list_transactions(
    *,
    session: Session,
    owner_id: uuid.UUID,
    skip: int = 0,
    limit: int = 20,
    type_filter: str | None = None,
    category_filter: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> tuple[list[Transaction], int]:
    from sqlalchemy import func

    base_filter = [Transaction.owner_id == owner_id]
    if type_filter:
        base_filter.append(Transaction.type == type_filter)
    if category_filter:
        base_filter.append(Transaction.category == category_filter)
    if date_from:
        base_filter.append(Transaction.transaction_date >= date_from)
    if date_to:
        base_filter.append(Transaction.transaction_date <= date_to)

    count = session.execute(
        select(func.count(Transaction.id)).where(*base_filter)
    ).scalar_one()

    rows = session.execute(
        select(Transaction)
        .where(*base_filter)
        .order_by(Transaction.transaction_date.desc(), Transaction.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).scalars().all()

    return list(rows), count
