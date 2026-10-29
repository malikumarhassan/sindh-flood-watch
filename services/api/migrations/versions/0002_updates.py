from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"


def upgrade():
    op.add_column("advisories", sa.Column("supersedes", sa.String, nullable=True))


def downgrade():
    op.drop_column("advisories", "supersedes")
