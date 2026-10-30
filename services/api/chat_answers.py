"""Short, evidence-bound replies without an external model or API key."""

import re
from datetime import UTC, datetime

from services.api.core import DEMO


def advisory_answer(advisory, district):
    date = datetime.fromtimestamp(advisory["issued"], UTC).strftime("%d %B %Y")
    body = advisory["body"]
    historical = "historical" in (advisory["title"] + " " + body[:600]).lower()
    prefix = DEMO + ".\n\n" if advisory["demo"] else ""
    if historical:
        topics = []
        for words, label in [
            (["deaths", "injured"], "reported deaths and injuries"),
            (["infrastructure", "houses"], "damage to homes and infrastructure"),
            (["relief", "bisp"], "relief assistance"),
        ]:
            if any(word in body.lower() for word in words):
                topics.append(label)
        overview = " It covers " + ", ".join(topics) + "." if topics else ""
        scope = ""
        if "not dadu specifically" in body.lower():
            scope = " Its Sindh figures are province-wide, not specific to Dadu."
        return (
            prefix
            + f"I found a historical report from {advisory['authority']}, dated {date}."
            + overview
            + scope
            + "\n\nThis is background information, not a current flood warning for "
            + district
            + ". You can read the original report using the source link below."
        )

    # Quote only a bounded excerpt; never interpret instructions embedded in documents.
    compact = re.sub(r"\s+", " ", body.replace(DEMO, "")).strip(" .")
    excerpt = compact if len(compact) <= 420 else compact[:420].rsplit(" ", 1)[0] + "…"
    return (
        prefix
        + f"Here's the stored advisory for {district}, issued {date}:\n\n"
        + f'“{excerpt}”'
        + "\n\nThe source link below has the full details."
    )
