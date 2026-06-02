"""add company to analyses

Revision ID: d4e8b21f9c05
Revises: c9f2a17d8e3b
Create Date: 2026-06-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd4e8b21f9c05'
down_revision = 'c9f2a17d8e3b'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('analyses', schema=None) as batch_op:
        batch_op.add_column(sa.Column('company', sa.String(80), nullable=True))


def downgrade():
    with op.batch_alter_table('analyses', schema=None) as batch_op:
        batch_op.drop_column('company')
