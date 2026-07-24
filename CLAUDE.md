# IT RADAR

Static web app tracking Korean IT competitions, hackathons, bootcamps, conferences, and community activities. Hosted on GitHub Pages at <https://joon56.github.io/IT_RADAR/>.

## Architecture

- `data/activities.json` is the **single source of truth**. Everything else derives from it.
- `index.html` + `css/style.css` + `js/app.js`: vanilla static site, no build step. Push = deploy.
- `docs/IT_activities_master.md` is auto-generated. Never edit it by hand; run `python tools/build_md.py`.
- `master_files/` holds the original manual documents (historical reference only, not maintained).

## Data schema (activities.json)

Top level: `{ updated: "YYYY-MM-DD", activities: [...] }`.

All dates in the data (`updated`, `added`, `checked`, event dates) are **KST (Asia/Seoul)** calendar dates. When bumping `updated`, use the current date in Seoul, not UTC. The UI shows "(KST)" next to the updated badge; the RSS feed stamps +09:00.

Each activity:

- `id`: kebab-case English slug (stable, never renamed)
- `name`: Korean display name
- `category`: one of "SW·웹 개발", "AI/ML 글로벌", "AI/ML 국내", "학술 챌린지", "의료·과학 AI", "알고리즘", "부트캠프", "동아리·커뮤니티", "컨퍼런스·박람회", "해커톤"
- `status` and `events[].type` follow the user's canonical classification below.
- `tags`: Korean keywords for filtering/search
- `url`, `prize`, `description`, `tip`: display fields (Korean)
- `added`: date the activity entered the list (drives the NEW badge). `checked`: date its facts were last verified against the web (drives re-verification priority).
- **Bilingual data**: the site has a KR/EN toggle. Every display field has an `_en` counterpart (`name_en`, `description_en`, `tip_en`, `prize_en`, `schedule_note_en`, `tags_en`, and `label_en` on events). The UI falls back to Korean when an `_en` field is missing, but when adding or editing activities ALWAYS fill both languages.
- `events`: array of `{ type, date: "YYYY-MM-DD", label? }`. Only concrete confirmed dates go here; fuzzy schedules ("2026 하반기") go in `schedule_note` instead.
- D-day badges and the deadline banner use `apply_end` + `partial_deadline`.

## Canonical classification (user-defined, latest version — overrides master_files)

Statuses (`status`):

- `applying` (신청 중): the activity is currently accepting participation applications, within a bounded window. For boundary-less competitions like Kaggle, do NOT use this; use `ongoing_open` instead.
- `upcoming` (접수 예정): will run this year but applications have not opened yet.
- `ongoing_open` (진행중/참가 가능): for competitions with no boundary between applying and competing (Kaggle-style) — running now and joinable now.
- `ongoing_closed` (진행중/참가 불가): the competition is running but applications already closed, so joining is currently impossible.
- `ended` (종료): completely finished.

Event types (`events[].type`):

- `apply_start` (신청 시작, green): the event where real pre-registration for the competition opens or access/permission is granted.
- `apply_end` (신청 마감, red): application deadline (end of the 신청 중 window).
- `activity_start` (대회 시작, blue): the date the competition actually starts (rounds/finals get `label`).
- `partial_deadline` (부분 제출 마감, orange): deadlines for specific documents or forms around the competition, e.g. summary or code submission due a week before the end.
- `activity_end` (활동 종료, slate): the complete end point of the competition.
- `announce` (발표, purple): scheduled results announcement date.

## Maintenance routine (when the user asks to refresh / 최신화)

The user's canonical 4-phase routine. Follow every phase, in order. Recommended cadence: **weekly** (the briefing's 10-day deadline horizon assumes roughly weekly refreshes).

### Phase 1 — Deep web search first, always

- Web-search EVERY activity whose status or dates could have changed (anything not `ended`, plus expected announcements). Prioritize activities with the oldest `checked` dates.
- **Source priority**: official site > competition platform (DACON, Kaggle, grand-challenge) > news > blogs. If no reliable confirmation exists, do NOT write a date — leave it in `schedule_note` marked "예상"/"expected".
- Deep-search for NEW events not yet in the list: hackathons, contests, bootcamps, conferences, expos, IT clubs (SOPT, YAPP, 넥스터즈, 디프만, DND, UMC, 큐시즘...), government programs. Include everything worth insight; the web UI filters by tags.
- Stamp `checked: <today>` on every activity actually verified this round.

### Phase 2 — Apply changes across the whole site

- Update `data/activities.json`: bump `updated`, flip statuses, add confirmed dates to `events`, add new activities, keep `ended` items (history).
  - New activities get `added: <today>` (drives the per-visitor NEW badge).
  - Append a `changelog` entry: `{ date, changes: [{ id, note, note_en }] }` covering additions and meaningful date/status changes. Newest first; the UI shows the latest 5 entries.
- **ID immutability (hard rule)**: NEVER rename or delete an activity `id`. Visitor bookmarks, checklist states, and ICS UIDs are all keyed by id — renaming silently breaks every visitor's saved data and subscribed calendars. Finished activities become `ended`, never deleted.
- **Annual rollover**: when a yearly competition's round ends (e.g. SCPC 2026 → `ended`), create the next round as a NEW activity (new id like `scpc-2027`, status `upcoming`) with the expected window in `schedule_note` marked "예상" based on past patterns. Keep the old round as history.
- Propagate beyond the list: review `roadmaps` step notes (stale dates/statuses), category set, and whether new activities belong in existing roadmaps or checklists.
- Regenerate derived files, in this order:
  - `py tools/build_briefing.py` — briefing for `updated` (idempotent per date)
  - `py tools/build_rss.py` — feed.xml from briefings
  - `py tools/build_md.py` — markdown master doc
  - `py tools/build_ics.py` — calendar.ics (stable UIDs let calendar apps update in place)
- Update `lastmod` in `sitemap.xml`.

### Phase 3 — Integrity check before shipping

- Run `py tools/validate.py` — checks enums, bilingual `_en` coverage (including event labels, checklist, roadmap steps, changelog, briefings), roadmap references, date logic, `added`/`checked` presence, and status-vs-today consistency. Must exit with 0 errors.
- Run `py tools/validate.py --links` at least once a month (or when adding activities) — pings every activity URL and curated link. Investigate warnings: DNS failures and 404s are real dead links to fix; 403s are usually bot-blocking and fine.

### Phase 4 — Redeploy

- Commit and push (English commit message, see conventions below). Push = deploy on GitHub Pages.
- Confirm the live site loads and shows the new `updated` date.

## Content fields beyond the basics

- `checklist` (optional, per activity): `[{ item, item_en }]` — prep steps shown as checkboxes on cards (checked state is localStorage, per visitor). Add for bootcamps and major competitions.
- `links` (optional, per activity): `[{ title, title_en, url }]` — curated links. ONLY verified/official URLs; never guess blog post URLs. The UI auto-adds Google/Velog/YouTube search links for every activity, so curated links are for things search can't find.
- `roadmaps` (top level): goal-based tracks `{ id, title, title_en, description, description_en, steps: [{ activityId, phase, phase_en, note, note_en }] }`. Each step references an activity by id — keep ids valid when renaming. Update step notes when statuses/dates change.
- `briefings` (top level): generated by build_briefing.py. Do not hand-edit.

## Conventions

- Everything committed to GitHub is written in **English**: commit messages, README, code comments, scripts.
- Korean stays in: user-facing UI strings, activity data content (names, descriptions, tips, tags).
- Commit messages: short imperative subject, e.g. `Update activity data (2026-08-01)` or `Add hackathon category filter`.
- No build tools, no npm, no frameworks. Keep it vanilla.
