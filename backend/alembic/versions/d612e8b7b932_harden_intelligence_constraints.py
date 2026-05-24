"""harden_intelligence_constraints

Revision ID: d612e8b7b932
Revises: 113a591f8823
Create Date: 2026-05-23 21:50:46.494843

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd612e8b7b932'
down_revision: Union[str, Sequence[str], None] = '113a591f8823'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column('customer_intelligence', 'restaurant_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('campaign_summaries', 'restaurant_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('reward_summaries', 'restaurant_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('automation_summaries', 'restaurant_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('business_summaries', 'restaurant_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('recommendations', 'restaurant_id',
               existing_type=sa.INTEGER(),
               nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('recommendations', 'restaurant_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('business_summaries', 'restaurant_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('automation_summaries', 'restaurant_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('reward_summaries', 'restaurant_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('campaign_summaries', 'restaurant_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('customer_intelligence', 'restaurant_id',
               existing_type=sa.INTEGER(),
               nullable=True)
