"""Container heartbeat probe. Reports process freshness, not source freshness."""

from services.api.db import Health, Session, now

if __name__ == "__main__":
    with Session() as db:
        row = db.get(Health, "worker")
        raise SystemExit(0 if row and row.checked and now() - row.checked < 90 else 1)
