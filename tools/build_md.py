"""Generate the markdown master document from data/activities.json.

Usage: python tools/build_md.py
Output: docs/IT_activities_master.md
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "activities.json"
OUT = ROOT / "docs" / "IT_activities_master.md"

STATUS_LABEL = {
    "applying": "🟢 신청 중",
    "ongoing_open": "🟢 진행중 (참가 가능)",
    "upcoming": "🔵 접수 예정",
    "ongoing_closed": "🟡 진행중 (참가 불가)",
    "ended": "⚫ 종료",
}
TYPE_LABEL = {
    "apply_start": "신청 시작",
    "apply_end": "신청 마감",
    "activity_start": "대회 시작",
    "partial_deadline": "부분 제출 마감",
    "activity_end": "활동 종료",
    "announce": "발표",
}
STATUS_ORDER = {"applying": 0, "ongoing_open": 1, "upcoming": 2, "ongoing_closed": 3, "ended": 4}


def schedule_line(a: dict) -> str:
    if a.get("events"):
        parts = [
            f"{e.get('label') or TYPE_LABEL[e['type']]}: {e['date']}"
            for e in a["events"]
        ]
        return " | ".join(parts)
    return a.get("schedule_note", "")


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    acts = data["activities"]

    counts: dict[str, int] = {}
    for a in acts:
        counts[a["status"]] = counts.get(a["status"], 0) + 1

    lines: list[str] = []
    lines.append("# IT 대외활동 & 경진대회 마스터 가이드")
    lines.append("")
    lines.append(f"> 기준일: **{data['updated']}** | 총 **{len(acts)}개** 항목")
    lines.append("> 이 문서는 `data/activities.json`에서 자동 생성됩니다. 직접 수정 금지.")
    lines.append("")
    lines.append("## 현황")
    lines.append("")
    for s in ["applying", "ongoing_open", "upcoming", "ongoing_closed", "ended"]:
        lines.append(f"- {STATUS_LABEL[s]}: {counts.get(s, 0)}개")
    lines.append("")

    cats: list[str] = []
    for a in acts:
        if a["category"] not in cats:
            cats.append(a["category"])

    for cat in cats:
        lines.append(f"## {cat}")
        lines.append("")
        cat_acts = sorted(
            (a for a in acts if a["category"] == cat),
            key=lambda a: STATUS_ORDER[a["status"]],
        )
        for a in cat_acts:
            lines.append(f"### {a['name']}")
            lines.append("")
            lines.append(f"{STATUS_LABEL[a['status']]}")
            lines.append("")
            lines.append("| 항목 | 내용 |")
            lines.append("|:---|:---|")
            lines.append(f"| URL | {a['url']} |")
            if a.get("prize"):
                lines.append(f"| 상금/혜택 | {a['prize']} |")
            sched = schedule_line(a)
            if sched:
                lines.append(f"| 일정 | {sched} |")
            if a.get("description"):
                lines.append(f"| 설명 | {a['description']} |")
            if a.get("tip"):
                lines.append(f"| 팁 | {a['tip']} |")
            if a.get("tags"):
                lines.append(f"| 태그 | {', '.join(a['tags'])} |")
            lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("일정은 주최 측 사정에 따라 변경될 수 있습니다. 지원 전 공식 사이트에서 확인하세요.")
    lines.append("")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT} ({len(acts)} activities)")


if __name__ == "__main__":
    main()
