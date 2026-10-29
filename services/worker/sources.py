"""Explicit pending adapters: no undocumented endpoints or automated scraping.

2026-10-29 review: FFD website reachable, PDMA request timed out.
No verified supported feed, scraping permission, or reusable publication licence.
The worker records integration status, never fabricates successful source checks.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class ManualSource:
    name: str
    url: str
    status: str = "Pending feed/permission verification. Use operator-reviewed manual upload."


ADAPTERS = [
    ManualSource("PDMA Sindh", "https://pdma.gos.pk/"),
    ManualSource("PMD Flood Forecasting Division", "https://ffd.pmd.gov.pk/"),
]


def check_sources(db):
    from services.api.db import Health, now

    for source in ADAPTERS:
        row = db.get(Health, source.name)
        if not row:
            row = Health(id=source.name, status=source.status)
            db.add(row)
        row.checked = now()
        row.status = source.status
        # successful deliberately stays NULL until actual source retrieval exists.
