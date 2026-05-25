"""make_profile_id_non_nullable

Revision ID: 518cfd941c5c
Revises: 006a1141ee3d
Create Date: 2026-05-25 17:14:42.741843

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '518cfd941c5c'
down_revision: Union[str, Sequence[str], None] = '006a1141ee3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    meta = sa.MetaData()
    users_tbl = sa.Table(
        'users', meta,
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('profile_id', sa.Integer),
        sa.Column('username', sa.String)
    )
    profiles_tbl = sa.Table(
        'user_profiles', meta,
        sa.Column('id', sa.Integer, primary_key=True),
        sa.Column('last_name', sa.String),
        sa.Column('created_at', sa.DateTime),
        sa.Column('updated_at', sa.DateTime)
    )
    
    connection = op.get_bind()
    
    # 1. Backfill profiles for users who do not have one
    select_stmt = sa.select(users_tbl.c.id, users_tbl.c.username).where(users_tbl.c.profile_id == None)
    results = connection.execute(select_stmt).fetchall()
    
    import datetime
    now = datetime.datetime.utcnow()
    
    for row in results:
        user_id = row[0]
        username = row[1]
        
        # Insert profile with username as last_name
        insert_stmt = profiles_tbl.insert().values(
            last_name=username,
            created_at=now,
            updated_at=now
        )
        res = connection.execute(insert_stmt)
        profile_id = res.inserted_primary_key[0]
        
        # Link user to the newly created profile
        update_stmt = users_tbl.update().where(users_tbl.c.id == user_id).values(profile_id=profile_id)
        connection.execute(update_stmt)
        
    # 2. Enforce non-nullable constraint on profile_id (using batch mode for SQLite support)
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('profile_id',
               existing_type=sa.Integer(),
               nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('profile_id',
               existing_type=sa.Integer(),
               nullable=True)
