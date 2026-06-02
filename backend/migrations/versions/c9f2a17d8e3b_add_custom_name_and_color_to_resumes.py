"""add custom_name and color to resumes

Revision ID: c9f2a17d8e3b
Revises: b4851cf2081e
Create Date: 2026-06-02 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c9f2a17d8e3b'
down_revision = 'b4851cf2081e'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('resumes', schema=None) as batch_op:
        batch_op.add_column(sa.Column('custom_name', sa.String(100), nullable=True))
        batch_op.add_column(sa.Column('color', sa.String(20), nullable=True))


def downgrade():
    with op.batch_alter_table('resumes', schema=None) as batch_op:
        batch_op.drop_column('color')
        batch_op.drop_column('custom_name')
