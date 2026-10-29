import io
import json
import os
import secrets
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Literal
from urllib.parse import urlparse

from fastapi import Depends, FastAPI, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import delete, select, text
from sqlalchemy.exc import SQLAlchemyError

from services.api.core import DEMO, DISTRICTS, audit, digest, enqueue, public, uid
from services.api.db import (
    Admin,
    Advisory,
    Audit,
    Delivery,
    Health,
    Login,
    Session,
    Subscription,
    now,
)


@asynccontextmanager
async def lifespan(app):
    # Schema changes are exclusively managed by Alembic.
    yield


app = FastAPI(title="Sindh Flood Watch", lifespan=lifespan)
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:8081").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)
windows = defaultdict(deque)


@app.middleware("http")
async def limits(request, call_next):
    if request.method in ["POST", "PUT"]:
        size = request.headers.get("content-length")
        if size is None:
            return Response("Content-Length required", status_code=411)
        try:
            if int(size) > 3 * 1024 * 1024:
                return Response("Request exceeds 3 MiB", status_code=413)
        except ValueError:
            return Response("Invalid Content-Length", status_code=400)
    # Local single-process limit. Public deployment requires a shared gateway limit.
    key = (request.client.host, request.url.path == "/auth/login")
    q = windows[key]
    tick = time.monotonic()
    while q and q[0] < tick - 60:
        q.popleft()
    cap = 10 if key[1] else 120
    if len(q) >= cap:
        return Response("Rate limit exceeded", status_code=429, headers={"Retry-After": "60"})
    q.append(tick)
    if len(windows) > 10000:
        windows.clear()
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "no-store"
    return response


def db_session():
    with Session() as db:
        yield db


@app.get("/health/live")
def liveness():
    return {"status": "ok"}


@app.get("/health/ready")
def readiness(db=Depends(db_session)):
    try:
        db.execute(text("SELECT 1"))
        # Ensure migrations ran, not just that a database socket accepts traffic.
        db.execute(select(Advisory).limit(1))
    except SQLAlchemyError:
        raise HTTPException(503, "Database unavailable or migrations pending")
    return {"status": "ready"}


def admin(request: Request, db=Depends(db_session)):
    token = request.cookies.get("sfw_session", "")
    session = db.get(Login, digest(token)) if token else None
    if not session or session.expires < now():
        raise HTTPException(401, "Administrator authentication required")
    if request.method != "GET" and request.headers.get("origin") not in origins:
        raise HTTPException(403, "Trusted Origin header required")
    return session.admin


class Credentials(BaseModel):
    username: str = Field(max_length=100)
    password: str = Field(max_length=200)


@app.post("/auth/login")
def login(data: Credentials, response: Response, request: Request, db=Depends(db_session)):
    from services.api.manage import verify

    if request.headers.get("origin") not in origins:
        raise HTTPException(403, "Trusted Origin header required")
    user = db.get(Admin, data.username)
    if not user or not verify(data.password, user.password):
        raise HTTPException(401, "Invalid credentials")
    token = secrets.token_urlsafe(32)
    db.add(Login(id=digest(token), admin=user.id, expires=now() + 28800))
    audit(db, user.id, "login")
    db.commit()
    response.set_cookie(
        "sfw_session",
        token,
        httponly=True,
        secure=os.getenv("COOKIE_SECURE", "false") == "true",
        samesite="strict",
        max_age=28800,
    )
    return {"ok": True}


@app.post("/auth/logout")
def logout(request: Request, response: Response, who=Depends(admin), db=Depends(db_session)):
    db.execute(delete(Login).where(Login.id == digest(request.cookies.get("sfw_session", ""))))
    db.commit()
    response.delete_cookie("sfw_session")
    return {"ok": True}


class Bulletin(BaseModel):
    title: str = Field(min_length=5, max_length=200)
    body: str = Field(min_length=20, max_length=50000)
    districts: list[str] = Field(min_length=1, max_length=30)
    hazard: Literal["river", "flash", "urban"]
    severity: str = Field(min_length=1, max_length=100)
    authority: str = Field(min_length=1, max_length=200)
    source_url: str = Field(max_length=2000)
    issued: datetime
    expires: datetime
    demo: bool = True
    language: Literal["en", "ur", "sd"] = "en"
    translation_reviewed: bool = False
    supersedes: str | None = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def valid(self):
        if any(d not in DISTRICTS for d in self.districts):
            raise ValueError("Unknown district")
        if self.issued.tzinfo is None or self.expires.tzinfo is None or self.expires <= self.issued:
            raise ValueError("Use timezone-aware times and expiry after issue time")
        parsed = urlparse(self.source_url)
        if parsed.scheme != "https" or parsed.hostname not in {
            "pdma.gos.pk",
            "www.pdma.gos.pk",
            "ffd.pmd.gov.pk",
        }:
            raise ValueError("Use an official PDMA or FFD HTTPS reference; references are never fetched")
        if self.demo and DEMO not in self.body:
            self.body = DEMO + ". " + self.body
        return self


@app.get("/districts")
def districts():
    return DISTRICTS


@app.get("/advisories")
def advisories(
    district: str = "",
    hazard: str = "",
    q: str = "",
    severity: str = "",
    since: float = 0,
    demo: bool = False,
    db=Depends(db_session),
):
    rows = db.scalars(
        select(Advisory)
        .where(Advisory.demo == demo, Advisory.state.in_(["published", "expired", "withdrawn"]))
        .order_by(Advisory.issued.desc())
    )
    return [
        public(a)
        for a in rows
        if (not district or district in json.loads(a.districts))
        and (not hazard or a.hazard == hazard)
        and (not severity or severity == a.severity)
        and a.issued >= since
        and q.lower() in (a.title + " " + a.body).lower()
    ]


@app.get("/advisories/{identifier}")
def detail(identifier: str, db=Depends(db_session)):
    a = db.get(Advisory, identifier)
    if not a or a.state not in ["published", "expired", "withdrawn"]:
        raise HTTPException(404, "Advisory not available")
    return public(a)


@app.get("/sources")
def sources(db=Depends(db_session)):
    result = []
    for name, url in [
        ("PDMA Sindh", "https://pdma.gos.pk/"),
        ("PMD Flood Forecasting Division", "https://ffd.pmd.gov.pk/"),
    ]:
        h = db.get(Health, name)
        result.append(
            {
                "name": name,
                "url": url,
                "status": h.status
                if h
                else "Manual integration pending; no successful automated source check",
                "last_check": h.checked if h else None,
                "last_success": h.successful if h else None,
                "stale": not h or not h.successful or now() - h.successful > 21600,
            }
        )
    return result


@app.get("/admin/advisories")
def drafts(who=Depends(admin), db=Depends(db_session)):
    return [public(a) for a in db.scalars(select(Advisory).order_by(Advisory.ingested.desc()))]


def values(data):
    fields = data.model_dump()
    fields["districts"] = json.dumps(data.districts)
    fields["issued"] = data.issued.timestamp()
    fields["expires"] = data.expires.timestamp()
    return fields


@app.post("/admin/advisories")
def create(data: Bulletin, who=Depends(admin), db=Depends(db_session)):
    if data.supersedes:
        previous = db.get(Advisory, data.supersedes)
        if not previous or previous.demo != data.demo or previous.state != "published":
            raise HTTPException(
                409, "Update must reference a published advisory in the same demo/live collection"
            )
    a = Advisory(id=uid(), **values(data))
    db.add(a)
    audit(db, who, f"create draft {a.id}")
    db.commit()
    return public(a)


@app.put("/admin/advisories/{identifier}")
def edit(identifier: str, data: Bulletin, who=Depends(admin), db=Depends(db_session)):
    a = db.get(Advisory, identifier)
    if not a:
        raise HTTPException(404)
    if a.state not in ["draft", "approved"]:
        raise HTTPException(
            409,
            "Withdraw the existing bulletin and create an updated bulletin; published content is immutable",
        )
    if a.demo != data.demo:
        raise HTTPException(409, "Demo/live identity is immutable")
    for k, v in values(data).items():
        setattr(a, k, v)
    a.state = "draft"
    a.revision += 1
    audit(db, who, f"edit/reset approval {a.id} revision {a.revision}")
    db.commit()
    return public(a)


@app.post("/admin/advisories/{identifier}/{action}")
def transition(
    identifier: str,
    action: Literal["approve", "publish", "withdraw", "expire"],
    who=Depends(admin),
    db=Depends(db_session),
):
    a = db.scalar(select(Advisory).where(Advisory.id == identifier).with_for_update())
    if not a:
        raise HTTPException(404)
    allowed = {
        "approve": ["draft"],
        "publish": ["approved"],
        "withdraw": ["published"],
        "expire": ["published"],
    }
    if a.state not in allowed[action]:
        raise HTTPException(409, "Invalid lifecycle transition")
    if action in ["approve", "publish"]:
        if a.expires <= now() or a.issued > now():
            raise HTTPException(409, "Advisory is expired or not yet issued")
        if a.language != "en" and not a.translation_reviewed:
            raise HTTPException(409, "Human translation review required")
    a.state = {"approve": "approved", "publish": "published", "withdraw": "withdrawn", "expire": "expired"}[
        action
    ]
    if action in ["publish", "withdraw", "expire"]:
        if action == "publish" and a.supersedes:
            previous = db.scalar(select(Advisory).where(Advisory.id == a.supersedes).with_for_update())
            if not previous or previous.state != "published" or previous.demo != a.demo:
                raise HTTPException(409, "The advisory being updated is no longer published")
            previous.state = "withdrawn"
            enqueue(db, previous, "withdrawal")
        enqueue(
            db,
            a,
            {
                "publish": "update" if a.supersedes else "warning",
                "withdraw": "withdrawal",
                "expire": "expiry",
            }[action],
        )
    audit(db, who, f"{action} {a.id} revision {a.revision}")
    db.commit()
    return public(a)


@app.post("/admin/upload")
async def upload(file: UploadFile, who=Depends(admin)):
    data = await file.read(2 * 1024 * 1024 + 1)
    if len(data) > 2 * 1024 * 1024:
        raise HTTPException(413, "Maximum upload is 2 MiB")
    try:
        if file.content_type == "application/pdf" and data.startswith(b"%PDF"):
            from pypdf import PdfReader

            reader = PdfReader(io.BytesIO(data))
            if len(reader.pages) > 30:
                raise ValueError("Maximum 30 pages")
            text = "\n".join(p.extract_text() or "" for p in reader.pages)[:50000]
        elif file.content_type == "text/plain":
            text = data.decode("utf-8")[:50000]
        else:
            raise ValueError("Upload UTF-8 text or a PDF")
    except Exception:
        raise HTTPException(422, "Could not extract bulletin. Use manual entry for scanned or invalid files.")
    return {
        "text": text,
        "status": "Untrusted extraction; review original wording and provenance before saving a draft",
    }


class Subscribe(BaseModel):
    districts: list[str] = Field(min_length=1, max_length=30)
    language: Literal["en", "ur", "sd"] = "en"
    channel: Literal["mock", "expo", "telegram"] = "mock"
    destination: str = Field(default="", max_length=300)
    demo: bool = True
    consent: bool

    @model_validator(mode="after")
    def valid(self):
        if not self.consent or any(d not in DISTRICTS for d in self.districts):
            raise ValueError("Consent and valid districts required")
        if self.demo and self.channel != "mock":
            raise ValueError("Demo subscriptions are mock-only")
        if self.channel == "expo" and not (
            self.destination.startswith(("ExponentPushToken[", "ExpoPushToken["))
            and self.destination.endswith("]")
        ):
            raise ValueError("An Expo push token is required")
        if self.channel == "telegram" and not self.destination.lstrip("-").isdigit():
            raise ValueError("A numeric Telegram chat ID is required")
        return self


@app.post("/subscriptions")
def subscribe(data: Subscribe, db=Depends(db_session)):
    secret = secrets.token_urlsafe(32)
    s = Subscription(id=uid(), secret=digest(secret), **data.model_dump(exclude={"consent"}))
    s.districts = json.dumps(data.districts)
    db.add(s)
    db.commit()
    return {
        "id": s.id,
        "token": secret,
        "status": "Subscribed; this does not confirm any notification delivery",
    }


def owned(identifier, request, db):
    s = db.get(Subscription, identifier)
    token = request.headers.get("authorization", "").removeprefix("Bearer ")
    if not s or not secrets.compare_digest(s.secret, digest(token)):
        raise HTTPException(404, "Subscription not found")
    return s


@app.put("/subscriptions/{identifier}")
def preferences(identifier: str, data: Subscribe, request: Request, db=Depends(db_session)):
    s = owned(identifier, request, db)
    for k, v in data.model_dump(exclude={"consent"}).items():
        setattr(s, k, json.dumps(v) if k == "districts" else v)
    s.consent_at = now()
    db.commit()
    return {"status": "Preferences saved"}


@app.delete("/subscriptions/{identifier}")
def unsubscribe(identifier: str, request: Request, db=Depends(db_session)):
    s = owned(identifier, request, db)
    db.execute(delete(Delivery).where(Delivery.subscriber == s.id))
    db.delete(s)
    db.commit()
    return {"status": "Subscription and delivery records deleted"}


@app.get("/subscriptions/{identifier}/deliveries")
def deliveries(identifier: str, request: Request, db=Depends(db_session)):
    s = owned(identifier, request, db)
    return [
        {"kind": d.kind, "status": d.status, "attempts": d.attempts, "receipt": d.receipt}
        for d in db.scalars(select(Delivery).where(Delivery.subscriber == s.id))
    ]


@app.get("/preparedness")
def preparedness(q: str = ""):
    # Conservative reviewed product guidance; no emergency translation is published.
    docs = [
        {
            "id": "information",
            "title": "Make an information plan",
            "body": "Choose your district manually. Check the original official bulletin, its issue time and expiry. Keep another official information channel available. Missing information does not establish safety.",
            "source_url": "https://ffd.pmd.gov.pk/",
            "authority": "Sindh Flood Watch editorial guidance",
            "reviewed": "2026-10-29",
            "language": "en",
            "status": "approved",
        },
        {
            "id": "offline",
            "title": "Prepare for poor connectivity",
            "body": "Save essential documents and contact details offline. Keep your phone charged when possible. Saved advisories may be outdated; check their timestamps when connectivity returns.",
            "source_url": "https://pdma.gos.pk/",
            "authority": "Sindh Flood Watch editorial guidance",
            "reviewed": "2026-10-29",
            "language": "en",
            "status": "approved",
        },
    ]
    return [d for d in docs if q.lower() in (d["title"] + " " + d["body"]).lower()]


class Question(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    district: str = ""
    demo: bool = False


@app.post("/chat")
def chat(data: Question, db=Depends(db_session)):
    question = data.question.lower()
    district = next((d for d in DISTRICTS if d.lower() in question), data.district)
    if any(w in question for w in ["predict", "safe", "evacuat", "route", "shelter", "helpline"]):
        return {
            "answer": "I do not have verified information for this question",
            "citations": [],
            "mode": "structured retrieval",
        }
    if any(w in question for w in ["prepar", "connectivity", "information plan"]):
        docs = preparedness()
        return {
            "answer": "\n\n".join(d["body"] for d in docs),
            "citations": docs,
            "mode": "structured retrieval",
        }
    if not any(w in question for w in ["advisory", "warning", "flood", "latest", "update"]):
        return {
            "answer": "I do not have verified information for this question",
            "citations": [],
            "mode": "structured retrieval",
        }
    if not district:
        return {
            "answer": "Which district in Sindh would you like information for?",
            "citations": [],
            "mode": "structured retrieval",
        }
    rows = advisories(district=district, demo=data.demo, db=db)
    rows = [a for a in rows if a["current"]]
    if not rows:
        return {
            "answer": "I do not have verified information for this question",
            "citations": [],
            "mode": "structured retrieval",
        }
    a = rows[0]
    # Return stored evidence verbatim. Documents never become model instructions.
    return {
        "answer": a["body"],
        "citations": [
            {
                "title": a["title"],
                "source_url": a["source_url"],
                "authority": a["authority"],
                "issued": a["issued"],
                "demo": a["demo"],
            }
        ],
        "mode": "structured retrieval",
    }


@app.get("/admin/health")
def health(who=Depends(admin), db=Depends(db_session)):
    return {
        "sources": sources(db),
        "worker": [
            {"name": h.id, "checked": h.checked, "status": h.status}
            for h in db.scalars(select(Health).where(Health.id == "worker"))
        ],
        "deliveries": [
            {"id": d.id, "status": d.status, "attempts": d.attempts, "kind": d.kind}
            for d in db.scalars(select(Delivery))
        ],
        "audit": [
            {"at": a.at, "actor": a.actor, "action": a.action}
            for a in db.scalars(select(Audit).order_by(Audit.at.desc()).limit(100))
        ],
    }
