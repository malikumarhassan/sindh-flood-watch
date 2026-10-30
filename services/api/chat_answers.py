"""Short, evidence-bound replies without an external model or API key."""

import re
from datetime import UTC, datetime

from services.api.core import DEMO


CHAT_TEXT = {
    "missing": (
        "I do not have verified information for this question",
        "میرے پاس اس سوال کے لیے تصدیق شدہ معلومات نہیں ہیں۔",
        "مون وٽ هن سوال لاءِ تصديق ٿيل ڄاڻ ناهي.",
    ),
    "district": (
        "Which district in Sindh would you like information for?",
        "آپ سندھ کے کس ضلع کی معلومات چاہتے ہیں؟",
        "توهان سنڌ جي ڪهڙي ضلعي بابت ڄاڻ چاهيو ٿا؟",
    ),
    "guidance": (
        "Read the preparedness guidance using the sources below.",
        "تیاری کی رہنمائی کے لیے نیچے دیے گئے ماخذ دیکھیں۔ اصل رہنمائی انگریزی میں ہے؛ اس کا تصدیق شدہ اردو ترجمہ ابھی دستیاب نہیں۔",
        "تياريءَ جي رهنمائي لاءِ هيٺ ڏنل ذريعا ڏسو. اصل رهنمائي انگريزيءَ ۾ آهي؛ ان جو تصديق ٿيل سنڌي ترجمو اڃا موجود ناهي.",
    ),
}


def chat_text(language, key):
    return CHAT_TEXT[key][{"en": 0, "ur": 1, "sd": 2}[language]]


def advisory_answer(advisory, district, language="en"):
    date = datetime.fromtimestamp(advisory["issued"], UTC).strftime("%d %B %Y")
    body = advisory["body"]
    historical = "historical" in (advisory["title"] + " " + body[:600]).lower()
    prefix = DEMO + ".\n\n" if advisory["demo"] else ""
    if language != "en":
        urdu = language == "ur"
        prefix = (
            ("ڈیمو — یہ حقیقی انتباہ نہیں۔\n\n" if urdu else "ڊيمو — هي حقيقي چتاءُ ناهي.\n\n")
            if advisory["demo"]
            else ""
        )
        # Use a localized description of metadata. Do not machine-translate source wording.
        if historical:
            scope = ""
            if "not dadu specifically" in body.lower():
                scope = (
                    " اعداد و شمار پورے سندھ کے ہیں، خاص طور پر دادو کے نہیں۔"
                    if urdu
                    else " انگ اکر سڄي سنڌ جا آهن، خاص طور دادو جا ناهن."
                )
            if urdu:
                return (
                    prefix
                    + f"مجھے ایک تاریخی رپورٹ ملی ہے۔ ادارہ: {advisory['authority']}۔ تاریخ: {date}۔"
                    + scope
                    + "\n\nیہ پس منظر کی معلومات ہیں، موجودہ سیلابی انتباہ نہیں۔ اصل رپورٹ نیچے دیے گئے ماخذ سے پڑھیں۔"
                )
            return (
                prefix
                + f"مون کي هڪ تاريخي رپورٽ ملي آهي. ادارو: {advisory['authority']}. تاريخ: {date}."
                + scope
                + "\n\nهي پسمنظر جي ڄاڻ آهي، موجوده ٻوڏ جو چتاءُ ناهي. اصل رپورٽ هيٺ ڏنل ذريعي تان پڙهو."
            )
        if urdu:
            return (
                prefix
                + f"منتخب ضلع کے لیے ایک اطلاع دستیاب ہے، جس کی تاریخ {date} ہے۔"
                + " اصل متن اپنی اشاعتی زبان میں محفوظ ہے۔ مکمل اطلاع پڑھنے کے لیے نیچے ماخذ کھولیں۔"
            )
        return (
            prefix
            + f"چونڊيل ضلعي لاءِ هڪ اطلاع موجود آهي، جنهن جي تاريخ {date} آهي."
            + " اصل متن پنهنجي اشاعتي ٻوليءَ ۾ محفوظ آهي. مڪمل اطلاع پڙهڻ لاءِ هيٺ ذريعو کوليو."
        )
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
        + f"“{excerpt}”"
        + "\n\nThe source link below has the full details."
    )
