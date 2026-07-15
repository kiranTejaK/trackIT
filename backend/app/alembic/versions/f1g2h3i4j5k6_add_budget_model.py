"""Add Budget model.

Revision ID: f1g2h3i4j5k6
Revises: a1b2c3d4e5f6
Create Date: 2026-07-14 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f1g2h3i4j5k6'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'budget',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('owner_id', sa.Uuid(), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('monthly_limit', sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(['owner_id'], ['user.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('owner_id', 'category', 'month', 'year', name='uq_budget_user_cat_month')
    )
    op.create_index(op.f('ix_budget_owner_id'), 'budget', ['owner_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_budget_owner_id'), table_name='budget')
    op.drop_table('budget')
