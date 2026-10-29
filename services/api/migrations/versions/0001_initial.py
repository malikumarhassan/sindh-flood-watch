"""Initial schema, immutable versioned metadata snapshot."""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None


def upgrade():
    op.create_table(
        "admins", sa.Column("id", sa.String, primary_key=True), sa.Column("password", sa.Text, nullable=False)
    )
    op.create_table(
        "sessions",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("admin", sa.String, nullable=False),
        sa.Column("expires", sa.Float, nullable=False),
    )
    op.create_table(
        "advisories",
        sa.Column("id", sa.String, primary_key=True),
        *[
            sa.Column(k, sa.Text, nullable=False)
            for k in [
                "title",
                "body",
                "districts",
                "hazard",
                "severity",
                "authority",
                "source_url",
                "state",
                "language",
            ]
        ],
        *[sa.Column(k, sa.Float, nullable=False) for k in ["issued", "expires", "ingested"]],
        sa.Column("demo", sa.Boolean, nullable=False),
        sa.Column("translation_reviewed", sa.Boolean, nullable=False),
        sa.Column("revision", sa.Integer, nullable=False),
    )
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.String, primary_key=True),
        *[
            sa.Column(k, sa.Text, nullable=False)
            for k in ["secret", "districts", "language", "channel", "destination"]
        ],
        sa.Column("demo", sa.Boolean, nullable=False),
        sa.Column("consent_at", sa.Float, nullable=False),
    )
    op.create_table(
        "outbox",
        sa.Column("id", sa.String, primary_key=True),
        *[
            sa.Column(k, sa.Text, nullable=False)
            for k in ["event", "subscriber", "advisory", "kind", "status", "receipt"]
        ],
        sa.Column("attempts", sa.Integer, nullable=False),
        sa.Column("next_attempt", sa.Float, nullable=False),
        sa.UniqueConstraint("event", "subscriber"),
    )
    op.create_table(
        "audit",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("at", sa.Float, nullable=False),
        sa.Column("actor", sa.String, nullable=False),
        sa.Column("action", sa.Text, nullable=False),
    )
    op.create_table(
        "health",
        sa.Column("id", sa.String, primary_key=True),
        sa.Column("checked", sa.Float),
        sa.Column("successful", sa.Float),
        sa.Column("status", sa.Text, nullable=False),
    )


def downgrade():
    for table in ["health", "audit", "outbox", "subscriptions", "advisories", "sessions", "admins"]:
        op.drop_table(table)
