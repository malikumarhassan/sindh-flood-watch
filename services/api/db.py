import os
from datetime import UTC, datetime

from sqlalchemy import (
    Boolean,
    Float,
    Integer,
    String,
    Text,
    UniqueConstraint,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker


def now():
    return datetime.now(UTC).timestamp()


def database_url(value):
    """Accept Neon's standard PostgreSQL URI with our installed psycopg 3 driver."""
    for prefix in ("postgresql://", "postgres://"):
        if value.startswith(prefix):
            return "postgresql+psycopg://" + value[len(prefix) :]
    return value


engine = create_engine(
    database_url(os.getenv("DATABASE_URL", "sqlite:///./sindh.db")), pool_pre_ping=True, pool_recycle=240
)
Session = sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class Admin(Base):
    __tablename__ = "admins"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    password: Mapped[str] = mapped_column(Text)


class Login(Base):
    __tablename__ = "sessions"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    admin: Mapped[str] = mapped_column(String)
    expires: Mapped[float] = mapped_column(Float)


class Advisory(Base):
    __tablename__ = "advisories"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String)
    body: Mapped[str] = mapped_column(Text)
    districts: Mapped[str] = mapped_column(Text)
    hazard: Mapped[str] = mapped_column(String)
    severity: Mapped[str] = mapped_column(String)
    authority: Mapped[str] = mapped_column(String)
    source_url: Mapped[str] = mapped_column(Text)
    issued: Mapped[float] = mapped_column(Float)
    expires: Mapped[float] = mapped_column(Float)
    ingested: Mapped[float] = mapped_column(Float, default=now)
    state: Mapped[str] = mapped_column(String, default="draft")
    demo: Mapped[bool] = mapped_column(Boolean, default=True)
    language: Mapped[str] = mapped_column(String, default="en")
    translation_reviewed: Mapped[bool] = mapped_column(Boolean, default=False)
    revision: Mapped[int] = mapped_column(Integer, default=1)
    supersedes: Mapped[str | None] = mapped_column(String, nullable=True)


class Subscription(Base):
    __tablename__ = "subscriptions"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    secret: Mapped[str] = mapped_column(String)
    districts: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String)
    channel: Mapped[str] = mapped_column(String)
    destination: Mapped[str] = mapped_column(Text)
    demo: Mapped[bool] = mapped_column(Boolean)
    consent_at: Mapped[float] = mapped_column(Float, default=now)


class Delivery(Base):
    __tablename__ = "outbox"
    __table_args__ = (UniqueConstraint("event", "subscriber"),)
    id: Mapped[str] = mapped_column(String, primary_key=True)
    event: Mapped[str] = mapped_column(String)
    subscriber: Mapped[str] = mapped_column(String)
    advisory: Mapped[str] = mapped_column(String)
    kind: Mapped[str] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, default="pending")
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    next_attempt: Mapped[float] = mapped_column(Float, default=now)
    receipt: Mapped[str] = mapped_column(Text, default="")


class Audit(Base):
    __tablename__ = "audit"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    at: Mapped[float] = mapped_column(Float, default=now)
    actor: Mapped[str] = mapped_column(String)
    action: Mapped[str] = mapped_column(Text)


class Health(Base):
    __tablename__ = "health"
    id: Mapped[str] = mapped_column(String, primary_key=True)
    checked: Mapped[float | None] = mapped_column(Float, nullable=True)
    successful: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(Text)
