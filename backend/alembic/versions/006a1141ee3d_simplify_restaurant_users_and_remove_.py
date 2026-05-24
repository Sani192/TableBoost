"""simplify_restaurant_users_and_remove_role

Revision ID: 006a1141ee3d
Revises: d612e8b7b932
Create Date: 2026-05-24 10:39:16.640082

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '006a1141ee3d'
down_revision: Union[str, Sequence[str], None] = 'd612e8b7b932'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Drop the role column from restaurant_users
    op.drop_column('restaurant_users', 'role')

    # 2. Backfill any orphan users in the database by linking them to restaurant_id = 1
    connection = op.get_bind()
    query = sa.text("""
        INSERT INTO restaurant_users (restaurant_id, user_id, created_at)
        SELECT 1, id, CURRENT_TIMESTAMP
        FROM users
        WHERE id NOT IN (SELECT user_id FROM restaurant_users)
    """)
    connection.execute(query)


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('restaurant_users', sa.Column('role', sa.String(), nullable=True))
    
    # Backfill the role column from the users table
    connection = op.get_bind()
    query = sa.text("""
        UPDATE restaurant_users
        SET role = (SELECT role FROM users WHERE users.id = restaurant_users.user_id)
    """)
    connection.execute(query)
    
    # Make role non-nullable again
    op.alter_column('restaurant_users', 'role', nullable=False)
