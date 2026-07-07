"""Initial schema

Revision ID: bc9b1282ed47
Revises: 346bb0398c0a
Create Date: 2026-05-10 22:48:45.169555

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bc9b1282ed47'
down_revision: Union[str, Sequence[str], None] = '346bb0398c0a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
