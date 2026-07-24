<div align="center">

# 📡 IT RADAR

**Catch every IT competition, hackathon, bootcamp, and dev event in Korea — before the deadline catches you.**

[![Live Site](https://img.shields.io/badge/live-joon56.github.io%2FIT__RADAR-2ea44f?style=for-the-badge&logo=googlechrome&logoColor=white)](https://joon56.github.io/IT_RADAR/)

[![Activities](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fjoon56.github.io%2FIT_RADAR%2Fdata%2Factivities.json&query=%24.activities.length&label=activities&color=58a6ff)](https://joon56.github.io/IT_RADAR/#view=list)
[![Last Update](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fjoon56.github.io%2FIT_RADAR%2Fdata%2Factivities.json&query=%24.updated&label=data%20updated&color=3fb950)](https://joon56.github.io/IT_RADAR/#view=briefing)
[![Deploy](https://img.shields.io/github/deployments/joon56/IT_RADAR/github-pages?label=pages&color=bc8cff)](https://github.com/joon56/IT_RADAR/deployments)
[![RSS](https://img.shields.io/badge/RSS-briefings-f0883e?logo=rss&logoColor=white)](https://joon56.github.io/IT_RADAR/feed.xml)

*Bilingual (한국어 / English) · Dark theme · Zero dependencies · Free forever*

📖 **[이용 가이드 (User Guide, Korean)](docs/GUIDE.md)**

</div>

---

## 🗺️ Five ways to look at the same radar

| | View | What it shows |
|:---:|:---|:---|
| 📅 | **Calendar** | Monthly grid with color-coded event chips. Click any date to see that day's events and every activity currently accepting applications. |
| 📊 | **Timeline** | A 6-month gantt: green application windows, blue activity periods, red deadline diamonds, and a today line. |
| 📋 | **List** | Filter by status, category, and tags. Full-text search in both languages. D-day badges that turn red as deadlines close in. |
| 🧭 | **Roadmaps** | Goal-based tracks — *Samsung employment*, *AI researcher*, *web dev*, *first activities*, *medical AI*, *global big tech* — each step wired to live activity data. |
| 📰 | **Briefing** | Auto-generated digest for every data refresh: what's new, what changed, what's due. Subscribable via RSS. |

## ✨ Personal, without an account

Everything personal stays in **your browser** (localStorage). No sign-up, no server, nothing shared.

- ⭐ **Bookmarks** — star activities, get a personal D-day strip and a "My picks" filter
- ✅ **Prep checklists** — per-activity to-dos with saved progress
- 🆕 **NEW badges** — see what appeared since *your* last visit
- 🌐 **KR / EN toggle** — every activity is fully bilingual
- 📆 **Calendar subscription** — one click adds every deadline to Google / Apple / Outlook calendars, auto-updating via [`calendar.ics`](https://joon56.github.io/IT_RADAR/calendar.ics)
- 🔗 **Shareable filters** — filter state lives in the URL hash

## ⚙️ How it works

```mermaid
flowchart LR
    A[("data/activities.json<br/>single source of truth")] --> W["index.html + app.js<br/>calendar · timeline · list · roadmaps"]
    A --> B["build_briefing.py"] --> R["build_rss.py → feed.xml"]
    A --> M["build_md.py → docs/*.md"]
    A --> I["build_ics.py → calendar.ics"]
    V["validate.py<br/>integrity gate"] -.checks.- A
    W & R & M & I --> P["git push = deploy<br/>GitHub Pages"]
```

One JSON file drives everything. Editing it and pushing **is** the whole deploy pipeline — no build tools, no npm, no framework.

## 🔄 Kept fresh automatically

A scheduled cloud agent re-verifies the data **three times a week** (Mon/Wed/Fri), following the 4-phase routine in [CLAUDE.md](CLAUDE.md):

1. **Deep web search** — verify every time-sensitive item against official sources; hunt for newly announced events
2. **Apply everywhere** — data, roadmaps, changelog, derived files
3. **Integrity gate** — `python3 tools/validate.py` must pass with 0 errors (bilingual coverage, date logic, reference checks, link liveness)
4. **Redeploy** — push to main

Data rules worth knowing: all dates are **KST**, activity IDs are **immutable** (bookmarks and calendar UIDs depend on them), yearly competitions **roll over** into new entries, and unverifiable dates are always marked *expected* — never fabricated.

## 📁 Structure

```text
data/activities.json    ← the one file that matters
index.html · css/ · js/ ← vanilla static site
tools/                  ← build_briefing · build_rss · build_md · build_ics · validate
calendar.ics · feed.xml ← generated feeds (subscribe!)
CLAUDE.md               ← data schema + maintenance playbook
```

---

<div align="center">

Published by **Minjoon Yoo**

[![Email](https://img.shields.io/badge/Email-webdamo56%40gmail.com-EA4335?logo=gmail&logoColor=white)](mailto:webdamo56@gmail.com)
[![GitHub](https://img.shields.io/badge/GitHub-joon56-181717?logo=github&logoColor=white)](https://github.com/joon56)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Minjoon_Yoo-0A66C2?logo=linkedin&logoColor=white)](https://www.linkedin.com/in/minjoon-yoo-798316286)

<sub>Schedules change at organizers' discretion — always confirm on the official site before applying.</sub>

</div>
