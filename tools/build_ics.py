"""Generate calendar.ics (subscribable iCalendar feed) from data/activities.json.

Usage: python tools/build_ics.py
Output: calendar.ics (repo root, served by GitHub Pages)

Every dated event of every activity becomes an all-day VEVENT with a stable UID,
so calendar apps update in place when dates change.
"""
import json
from datetime import UTC, date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "activities.json"
OUT = ROOT / "calendar.ics"

TYPE_LABEL = {
    "apply_start": "신청 시작",
    "apply_end": "신청 마감",
    "activity_start": "대회 시작",
    "partial_deadline": "부분 제출 마감",
    "activity_end": "활동 종료",
    "announce": "발표",
}
# Emoji prefix makes event type readable at a glance in calendar apps
TYPE_EMOJI = {
    "apply_start": "🟢",
    "apply_end": "🔴",
    "activity_start": "🔵",
    "partial_deadline": "🟠",
    "activity_end": "⚪",
    "announce": "🟣",
}


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def fold(line: str) -> str:
    """RFC 5545 line folding at 75 octets."""
    out = []
    raw = line.encode("utf-8")
    while len(raw) > 75:
        cut = 75
        while cut > 0 and (raw[cut] & 0xC0) == 0x80:  # do not split a UTF-8 char
            cut -= 1
        out.append(raw[:cut].decode("utf-8"))
        raw = b" " + raw[cut:]
    out.append(raw.decode("utf-8"))
    return "\r\n".join(out)


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//IT RADAR//activities//KO",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:IT RADAR",
        "X-WR-CALDESC:IT 공모전·해커톤·부트캠프 일정",
        "X-WR-TIMEZONE:Asia/Seoul",
    ]

    for a in data["activities"]:
        for ev in a.get("events", []):
            d = date.fromisoformat(ev["date"])
            label = ev.get("label") or TYPE_LABEL[ev["type"]]
            emoji = TYPE_EMOJI.get(ev["type"], "")
            uid = f"itradar-{a['id']}-{ev['type']}-{ev['date']}@joon56.github.io"
            summary = f"{emoji} {a['name']} — {label}"
            desc = " | ".join(x for x in [a.get("description", ""), a.get("url", "")] if x)
            lines += [
                "BEGIN:VEVENT",
                fold(f"UID:{uid}"),
                f"DTSTAMP:{stamp}",
                f"DTSTART;VALUE=DATE:{d.strftime('%Y%m%d')}",
                f"DTEND;VALUE=DATE:{(d + timedelta(days=1)).strftime('%Y%m%d')}",
                fold(f"SUMMARY:{esc(summary)}"),
                fold(f"DESCRIPTION:{esc(desc)}"),
                fold(f"URL:{a.get('url', '')}"),
                "END:VEVENT",
            ]

    lines.append("END:VCALENDAR")
    OUT.write_text("\r\n".join(lines) + "\r\n", encoding="utf-8")
    count = sum(len(a.get("events", [])) for a in data["activities"])
    print(f"Wrote {OUT} ({count} events)")


if __name__ == "__main__":
    main()
