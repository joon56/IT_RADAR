"""Integrity validator for data/activities.json (maintenance Phase 3).

Usage:
  py tools/validate.py           # structural + bilingual + date-logic checks
  py tools/validate.py --links   # additionally ping activity/curated URLs

Exit code 0 = no errors (warnings allowed), 1 = errors found.
"""
import json
import sys
import urllib.request
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "activities.json"

VALID_STATUS = {"applying", "ongoing_open", "upcoming", "ongoing_closed", "ended"}
VALID_TYPES = {"apply_start", "apply_end", "activity_start", "partial_deadline", "activity_end", "announce"}
REQUIRED_EN = ["name_en", "description_en", "tip_en", "prize_en"]

errors: list[str] = []
warnings: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def iso(s: str) -> date | None:
    try:
        return date.fromisoformat(s)
    except (ValueError, TypeError):
        return None


def check_activity(a: dict) -> None:
    aid = a.get("id", "<no id>")

    if a.get("status") not in VALID_STATUS:
        err(f"{aid}: invalid status {a.get('status')!r}")

    for k in REQUIRED_EN:
        if not a.get(k):
            err(f"{aid}: missing {k}")
    if a.get("schedule_note") and not a.get("schedule_note_en"):
        err(f"{aid}: schedule_note without schedule_note_en")
    if len(a.get("tags", [])) != len(a.get("tags_en", [])):
        err(f"{aid}: tags/tags_en length mismatch")

    for k in ("added", "checked"):
        if not iso(a.get(k, "")):
            err(f"{aid}: missing or invalid {k}")

    starts, ends = [], []
    for ev in a.get("events", []):
        if ev.get("type") not in VALID_TYPES:
            err(f"{aid}: invalid event type {ev.get('type')!r}")
        d = iso(ev.get("date", ""))
        if not d:
            err(f"{aid}: invalid event date {ev.get('date')!r}")
            continue
        if ev.get("label") and not ev.get("label_en"):
            err(f"{aid}: event {ev['date']} has label without label_en")
        if ev["type"] == "apply_start":
            starts.append(d)
        if ev["type"] == "apply_end":
            ends.append(d)
    if starts and ends and min(starts) > max(ends):
        err(f"{aid}: apply_start after apply_end")

    for c in a.get("checklist", []):
        if not c.get("item") or not c.get("item_en"):
            err(f"{aid}: checklist item missing item/item_en")
    for l in a.get("links", []):
        if not l.get("title") or not l.get("title_en") or not str(l.get("url", "")).startswith("http"):
            err(f"{aid}: malformed curated link {l}")


def check_status_vs_today(a: dict, today: date) -> None:
    """Statuses consistent with today's date (heuristic warnings)."""
    aid = a["id"]
    ends = [iso(e["date"]) for e in a.get("events", []) if e["type"] == "apply_end"]
    ends = [d for d in ends if d]
    if a["status"] == "applying" and ends and max(ends) < today:
        warn(f"{aid}: status 'applying' but last apply_end {max(ends)} has passed")
    if a["status"] == "upcoming":
        starts = [iso(e["date"]) for e in a.get("events", []) if e["type"] == "apply_start"]
        starts = [d for d in starts if d]
        if starts and min(starts) <= today:
            warn(f"{aid}: status 'upcoming' but apply_start {min(starts)} has passed")


def check_links_alive(d: dict) -> None:
    urls = []
    for a in d["activities"]:
        if a.get("url"):
            urls.append((a["id"], a["url"]))
        for l in a.get("links", []):
            urls.append((a["id"], l["url"]))
    print(f"Pinging {len(urls)} URLs...")
    for aid, url in urls:
        req = urllib.request.Request(url, method="GET", headers={"User-Agent": "Mozilla/5.0 (IT-RADAR link check)"})
        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                if resp.status >= 400:
                    warn(f"{aid}: {url} returned HTTP {resp.status}")
        except Exception as e:  # noqa: BLE001 - sites block bots; treat as warning
            warn(f"{aid}: {url} unreachable ({type(e).__name__})")


def main() -> None:
    d = json.loads(DATA.read_text(encoding="utf-8"))
    today = date.fromisoformat(d["updated"])

    ids = [a["id"] for a in d["activities"]]
    if len(ids) != len(set(ids)):
        err("duplicate activity ids")

    for a in d["activities"]:
        check_activity(a)
        check_status_vs_today(a, today)

    id_set = set(ids)
    for r in d.get("roadmaps", []):
        for s in r.get("steps", []):
            if s.get("activityId") not in id_set:
                err(f"roadmap {r.get('id')}: unknown activityId {s.get('activityId')!r}")
            for k in ("phase", "phase_en", "note", "note_en"):
                if not s.get(k):
                    err(f"roadmap {r.get('id')} step {s.get('activityId')}: missing {k}")

    for entry in d.get("changelog", []):
        if not iso(entry.get("date", "")):
            err(f"changelog entry with invalid date: {entry.get('date')!r}")
        for c in entry.get("changes", []):
            if not c.get("note") or not c.get("note_en"):
                err(f"changelog {entry.get('date')}: change missing note/note_en")

    for b in d.get("briefings", []):
        if not iso(b.get("date", "")) or not b.get("summary") or not b.get("summary_en"):
            err(f"briefing malformed: {b.get('date')!r}")
        for it in b.get("items", []):
            if not it.get("text") or not it.get("text_en") or it.get("kind") not in ("new", "change", "deadline"):
                err(f"briefing {b.get('date')}: malformed item {it}")

    if "--links" in sys.argv:
        check_links_alive(d)

    print(f"Activities: {len(ids)} | roadmaps: {len(d.get('roadmaps', []))} | briefings: {len(d.get('briefings', []))}")
    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    print(f"{len(errors)} errors, {len(warnings)} warnings")
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
