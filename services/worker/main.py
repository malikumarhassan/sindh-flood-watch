import os
import json
import time

import httpx
from sqlalchemy import select

from services.api.core import audit, enqueue
from services.api.db import Advisory, Delivery, Health, Session, Subscription, now


def send(db, delivery, subscriber, advisory):
    lifecycle = {
        "warning": "WARNING",
        "update": "UPDATED ADVISORY",
        "withdrawal": "WITHDRAWN — NO LONGER CURRENT",
        "expiry": "EXPIRED — NO LONGER CURRENT",
    }[delivery.kind]
    message = f"{'DEMO — NOT A REAL WARNING. ' if advisory.demo else ''}{lifecycle}: {advisory.title}. Original bulletin: {advisory.body} Source: {advisory.source_url}"
    if advisory.demo and subscriber.channel != "mock":
        return "suppressed", "Demo cannot reach an external provider"
    if subscriber.channel == "mock":
        return "mock_delivered", "Local mock inbox; no external notification sent"
    if os.getenv("ENABLE_REAL_NOTIFICATIONS") != "true":
        return "disabled", "External notifications disabled by configuration"
    # Providers do not guarantee idempotency. Mark in-flight durably BEFORE network
    # access. A crash/timeout is ambiguous and never automatically re-sent.
    delivery.status = "in_flight"
    db.commit()
    try:
        with httpx.Client(timeout=15, follow_redirects=False) as client:
            if subscriber.channel == "expo":
                response = client.post(
                    "https://exp.host/--/api/v2/push/send",
                    json={
                        "to": subscriber.destination,
                        "title": "Sindh Flood Watch",
                        "body": message[:3000],
                        "data": {"event": delivery.event},
                    },
                    headers={"Authorization": "Bearer " + os.getenv("EXPO_ACCESS_TOKEN", "")},
                )
            else:
                token = os.getenv("TELEGRAM_BOT_TOKEN")
                if not token:
                    return "disabled", "Telegram credentials not configured"
                response = client.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={"chat_id": subscriber.destination, "text": message[:4000]},
                )
        if response.status_code == 429:
            try:
                delay = max(30, min(86400, int(response.headers.get("Retry-After", "60"))))
            except ValueError:
                delay = 60
            delivery.next_attempt = now() + delay
            return "pending", "Provider rate limit; not accepted"
        if response.status_code >= 500:
            return "unknown", "Provider server error; acceptance uncertain. Manual reconciliation required"
        if response.status_code >= 400:
            return "failed", "Provider rejected request"
        result = response.json()
        if subscriber.channel == "expo":
            ticket = result.get("data", {})
            if ticket.get("status") != "ok":
                return "failed", "Expo rejected notification"
            return "accepted", "Expo ticket " + str(ticket.get("id", "")) + "; device delivery unconfirmed"
        if not result.get("ok"):
            return "failed", "Telegram rejected message"
        return "accepted", "Telegram accepted message; reading/device delivery unconfirmed"
    except (httpx.ConnectError, httpx.ConnectTimeout):
        delivery.next_attempt = now() + min(3600, 30 * 2**delivery.attempts)
        return "pending", "Connection not established; retry scheduled"
    except Exception:
        return "unknown", "Ambiguous provider outcome; no automatic resend"


def tick():
    with Session() as db:
        from services.worker.sources import check_sources

        check_sources(db)
        for a in db.scalars(
            select(Advisory)
            .where(Advisory.state == "published", Advisory.expires <= now())
            .with_for_update(skip_locked=True)
        ):
            a.state = "expired"
            enqueue(db, a, "expiry")
            audit(db, "worker", f"expire {a.id}")
        db.commit()
        # PostgreSQL locks prevent simultaneous worker dispatch. SQLite local mode
        # supports one worker only. Each provider call is spaced by the loop delay.
        delivery = db.scalar(
            select(Delivery)
            .where(Delivery.status == "pending", Delivery.next_attempt <= now())
            .order_by(Delivery.next_attempt)
            .with_for_update(skip_locked=True)
            .limit(1)
        )
        if delivery:
            a = db.get(Advisory, delivery.advisory)
            s = db.get(Subscription, delivery.subscriber)
            if (
                not a
                or not s
                or s.demo != a.demo
                or s.language != a.language
                or not set(json.loads(s.districts)) & set(json.loads(a.districts))
                or (delivery.kind in ["warning", "update"] and (a.state != "published" or a.expires <= now()))
            ):
                delivery.status, delivery.receipt = (
                    "suppressed",
                    "Advisory no longer current or subscriber deleted",
                )
            elif delivery.attempts >= 5:
                delivery.status, delivery.receipt = "failed", "Retry limit reached"
            else:
                delivery.attempts += 1
                delivery.status, delivery.receipt = send(db, delivery, s, a)
            audit(db, "worker", f"delivery {delivery.id} {delivery.status}")
        health = db.get(Health, "worker")
        if not health:
            health = Health(id="worker", status="running")
            db.add(health)
        health.checked, health.successful = now(), now()
        health.status = "Running; source collection pending permission/feed verification"
        db.commit()


if __name__ == "__main__":
    while True:
        try:
            tick()
        except Exception:
            # Never print provider URLs, tokens or subscriber data.
            print("Worker iteration failed; check database availability", flush=True)
        time.sleep(2)
