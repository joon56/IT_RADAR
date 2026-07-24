"""Generate feed.xml (RSS 2.0) from the briefings in data/activities.json.

Usage: python tools/build_rss.py (run after build_briefing.py)
"""
import json
from email.utils import format_datetime
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "activities.json"
OUT = ROOT / "feed.xml"
SITE = "https://joon56.github.io/IT_RADAR/"


def main() -> None:
    d = json.loads(DATA.read_text(encoding="utf-8"))
    items_xml = []
    for b in d.get("briefings", [])[:20]:
        pub = format_datetime(datetime.fromisoformat(b["date"]).replace(hour=9, tzinfo=KST))
        lines = "".join(f"<li>{escape(i['text'])}</li>" for i in b["items"])
        desc = escape(f"<p>{escape(b['summary'])}</p><ul>{lines}</ul>")
        items_xml.append(
            f"<item><title>IT RADAR 브리핑 {b['date']} — {escape(b['summary'])}</title>"
            f"<link>{SITE}#view=briefing</link>"
            f"<guid isPermaLink=\"false\">itradar-briefing-{b['date']}</guid>"
            f"<pubDate>{pub}</pubDate>"
            f"<description>{desc}</description></item>"
        )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0"><channel>'
        "<title>IT RADAR</title>"
        f"<link>{SITE}</link>"
        "<description>IT 공모전·해커톤·부트캠프 주간 브리핑</description>"
        "<language>ko</language>"
        + "".join(items_xml)
        + "</channel></rss>\n"
    )
    OUT.write_text(xml, encoding="utf-8")
    print(f"Wrote {OUT} ({len(items_xml)} items)")


if __name__ == "__main__":
    main()
