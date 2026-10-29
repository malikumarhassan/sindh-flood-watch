import hashlib
import json
import secrets

from sqlalchemy import select

from services.api.db import Advisory, Audit, Delivery, Subscription, now

DISTRICTS = [
    "Badin",
    "Dadu",
    "Ghotki",
    "Hyderabad",
    "Jacobabad",
    "Jamshoro",
    "Kambar Shahdadkot",
    "Karachi Central",
    "Karachi East",
    "Karachi South",
    "Karachi West",
    "Kashmore",
    "Keamari",
    "Khairpur",
    "Korangi",
    "Larkana",
    "Malir",
    "Matiari",
    "Mirpur Khas",
    "Naushahro Feroze",
    "Shaheed Benazirabad",
    "Sanghar",
    "Shikarpur",
    "Sujawal",
    "Sukkur",
    "Tando Allahyar",
    "Tando Muhammad Khan",
    "Tharparkar",
    "Thatta",
    "Umerkot",
]
DEMO = "DEMO — NOT A REAL WARNING"


def uid():
    return secrets.token_hex(16)


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def audit(db, actor, action):
    db.add(Audit(id=uid(), actor=actor, action=action))


def public(a):
    return {
        key: getattr(a, key)
        for key in [
            "id",
            "title",
            "body",
            "hazard",
            "severity",
            "authority",
            "source_url",
            "issued",
            "expires",
            "ingested",
            "state",
            "demo",
            "language",
            "revision",
        ]
    } | {
        "districts": json.loads(a.districts),
        "current": a.state == "published" and a.issued <= now() < a.expires,
    }


def enqueue(db, a, kind):
    # Called inside the same transaction as the approval/publication/withdrawal.
    event = f"{a.id}:{a.revision}:{kind}"
    for s in db.scalars(select(Subscription)):
        if s.demo != a.demo or (a.demo and s.channel != "mock"):
            continue
        if s.language != a.language or not set(json.loads(s.districts)) & set(json.loads(a.districts)):
            continue
        if not db.scalar(select(Delivery).where(Delivery.event == event, Delivery.subscriber == s.id)):
            db.add(Delivery(id=uid(), event=event, subscriber=s.id, advisory=a.id, kind=kind))


def seed(db):
    for district, hazard in [("Sukkur", "river"), ("Dadu", "flash"), ("Thatta", "urban")]:
        identifier = "demo-" + district.lower()
        if not db.get(Advisory, identifier):
            db.add(
                Advisory(
                    id=identifier,
                    title=f"{district}: fictional {hazard} flooding exercise",
                    body=f"{DEMO}. Fictional bulletin for testing district information and notification workflows. This sample contains no real flood observations or safety assessment.",
                    districts=json.dumps([district]),
                    hazard=hazard,
                    severity="Exercise advisory",
                    authority="Sindh Flood Watch demo fixture",
                    source_url="https://ffd.pmd.gov.pk/",
                    issued=now(),
                    expires=now() + 86400,
                    state="published",
                    demo=True,
                    language="en",
                    translation_reviewed=False,
                )
            )
    db.commit()
