"""Replace domain tables with TrackIT transaction model.

Revision ID: a1b2c3d4e5f6
Revises: f36b325a0281
Create Date: 2026-07-14 12:00:00.000000

Drops all previous domain tables (workspace, project, task, section,
workspacemember, projectmember, activitylog, attachment, comment,
invitation, item) and creates the `transaction` table for TrackIT.
Also removes job_title and avatar_url columns from user (no longer needed).
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "7f287cbcd2ce"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ------------------------------------------------------------------ #
    # Drop old domain tables (order matters — children before parents)    #
    # ------------------------------------------------------------------ #
    # Guard with IF EXISTS so re-running is idempotent
    op.execute("DROP TABLE IF EXISTS attachment CASCADE")
    op.execute("DROP TABLE IF EXISTS activitylog CASCADE")
    op.execute("DROP TABLE IF EXISTS comment CASCADE")
    op.execute("DROP TABLE IF EXISTS task CASCADE")
    op.execute("DROP TABLE IF EXISTS section CASCADE")
    op.execute("DROP TABLE IF EXISTS projectmember CASCADE")
    op.execute("DROP TABLE IF EXISTS project CASCADE")
    op.execute("DROP TABLE IF EXISTS workspacemember CASCADE")
    op.execute("DROP TABLE IF EXISTS workspace CASCADE")
    op.execute("DROP TABLE IF EXISTS invitation CASCADE")
    op.execute("DROP TABLE IF EXISTS item CASCADE")

    # Remove columns added in previous migrations that no longer exist on User
    # Use try/except-style raw SQL to guard against already-missing columns
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='user' AND column_name='job_title'
            ) THEN
                ALTER TABLE "user" DROP COLUMN job_title;
            END IF;
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name='user' AND column_name='avatar_url'
            ) THEN
                ALTER TABLE "user" DROP COLUMN avatar_url;
            END IF;
        END$$;
    """)

    # ------------------------------------------------------------------ #
    # Create TrackIT transaction table                                     #
    # ------------------------------------------------------------------ #
    op.create_table(
        "transaction",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("type", sa.String(length=10), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("owner_id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_transaction_owner_id", "transaction", ["owner_id"], unique=False
    )
    op.create_index(
        "ix_transaction_transaction_date",
        "transaction",
        ["transaction_date"],
        unique=False,
    )
    op.create_index(
        "ix_transaction_type", "transaction", ["type"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_transaction_type", table_name="transaction")
    op.drop_index("ix_transaction_transaction_date", table_name="transaction")
    op.drop_index("ix_transaction_owner_id", table_name="transaction")
    op.drop_table("transaction")
    # Note: restoring dropped tables on downgrade is intentionally omitted
    # as this is a domain replacement migration.
