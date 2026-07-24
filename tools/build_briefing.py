"""Generate/refresh the briefing entry for the current data date.

Usage: python tools/build_briefing.py
Reads data/activities.json, composes a briefing for `updated` date from:
- activities added on that date (NEW)
- the changelog entry matching that date (changes)
- deadlines within the next 10 days of that date

Idempotent: re-running replaces the entry for the same date.
Run AFTER editing activities.json, BEFORE build_rss.py.
"""
import json
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "activities.json"

TYPE_LABEL = {"apply_end": "신청 마감", "partial_deadline": "부분 제출 마감"}
TYPE_LABEL_EN = {"apply_end": "application deadline", "partial_deadline": "partial submission deadline"}


def main() -> None:
    d = json.loads(DATA.read_text(encoding="utf-8"))
    today = date.fromisoformat(d["updated"])
    horizon = today + timedelta(days=10)

    items = []

    for a in d["activities"]:
        if a.get("added") == d["updated"]:
            items.append({
                "kind": "new",
                "text": f"신규: {a['name']}",
                "text_en": f"New: {a.get('name_en', a['name'])}",
                "id": a["id"],
            })

    for entry in d.get("changelog", []):
        if entry["date"] == d["updated"]:
            for c in entry["changes"]:
                items.append({
                    "kind": "change",
                    "text": c["note"],
                    "text_en": c.get("note_en", c["note"]),
                    "id": c.get("id", ""),
                })

    deadline_items = []
    for a in d["activities"]:
        for ev in a.get("events", []):
            if ev["type"] not in TYPE_LABEL:
                continue
            ed = date.fromisoformat(ev["date"])
            if today <= ed <= horizon:
                dd = (ed - today).days
                label = ev.get("label") or TYPE_LABEL[ev["type"]]
                label_en = ev.get("label_en") or TYPE_LABEL_EN[ev["type"]]
                deadline_items.append((ed, {
                    "kind": "deadline",
                    "text": f"D-{dd} {a['name']} — {label} ({ev['date']})",
                    "text_en": f"D-{dd} {a.get('name_en', a['name'])} — {label_en} ({ev['date']})",
                    "id": a["id"],
                }))
    deadline_items.sort(key=lambda x: x[0])
    items += [it for _, it in deadline_items]

    n_new = sum(1 for i in items if i["kind"] == "new")
    n_chg = sum(1 for i in items if i["kind"] == "change")
    n_dl = sum(1 for i in items if i["kind"] == "deadline")
    summary = f"신규 {n_new}건 · 변경 {n_chg}건 · 10일 내 마감 {n_dl}건"
    summary_en = f"{n_new} new · {n_chg} changed · {n_dl} deadlines within 10 days"

    briefing = {"date": d["updated"], "summary": summary, "summary_en": summary_en, "items": items}

    briefings = [b for b in d.get("briefings", []) if b["date"] != d["updated"]]
    briefings.insert(0, briefing)
    briefings.sort(key=lambda b: b["date"], reverse=True)
    d["briefings"] = briefings

    DATA.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Briefing {d['updated']}: {summary} (total {len(briefings)} briefings)")


if __name__ == "__main__":
    main()
