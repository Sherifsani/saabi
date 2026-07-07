"""workers table and user virtual account

Creates the service-discovery ``workers`` table (its previous revision was a
no-op) and adds ``users.virtual_account_number`` for Nomba wallet funding.

Revision ID: a1b2c3d4e5f6
Revises: 94b44dbcba96
Create Date: 2026-07-07 16:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '94b44dbcba96'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'workers',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('full_name', sa.String(), nullable=False),
        sa.Column('phone_number', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('service_category', sa.String(), nullable=False),
        sa.Column('service_description', sa.String(), nullable=True),
        sa.Column('base_rate', sa.String(), nullable=True),
        sa.Column('lga', sa.String(), nullable=False),
        sa.Column('state', sa.String(), nullable=False),
        sa.Column('geo_lat', sa.Float(), nullable=True),
        sa.Column('geo_lng', sa.Float(), nullable=True),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('credibility_score', sa.Float(), nullable=False),
        sa.Column('rating', sa.Float(), nullable=False),
        sa.Column('review_count', sa.Integer(), nullable=False),
        sa.Column('is_available', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
        sa.UniqueConstraint('phone_number'),
    )
    op.create_index('ix_workers_service_lga', 'workers', ['service_category', 'lga'], unique=False)
    op.create_index('ix_workers_location', 'workers', ['geo_lat', 'geo_lng'], unique=False)
    op.create_index('ix_workers_rating', 'workers', ['rating'], unique=False)

    op.add_column('users', sa.Column('virtual_account_number', sa.String(), nullable=True))
    op.create_unique_constraint('uq_users_virtual_account_number', 'users', ['virtual_account_number'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('uq_users_virtual_account_number', 'users', type_='unique')
    op.drop_column('users', 'virtual_account_number')

    op.drop_index('ix_workers_rating', table_name='workers')
    op.drop_index('ix_workers_location', table_name='workers')
    op.drop_index('ix_workers_service_lga', table_name='workers')
    op.drop_table('workers')
