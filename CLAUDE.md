# IT RADAR

Static web app tracking Korean IT competitions, hackathons, bootcamps, conferences, and community activities. Hosted on GitHub Pages at <https://joon56.github.io/IT_RADAR/>.

## Architecture

- `data/activities.json` is the **single source of truth**. Everything else derives from it.
- `index.html` + `css/style.css` + `js/app.js`: vanilla static site, no build step. Push = deploy.
- `docs/IT_activities_master.md` is auto-generated. Never edit it by hand; run `python tools/build_md.py`.
- `master_files/` holds the original manual documents (historical reference only, not maintained).

## Data schema (activities.json)

Top level: `{ updated: "YYYY-MM-DD", activities: [...] }`.

Each activity:

- `id`: kebab-case English slug (stable, never renamed)
- `name`: Korean display name
- `category`: one of "SW·웹 개발", "AI/ML 글로벌", "AI/ML 국내", "학술 챌린지", "의료·과학 AI", "알고리즘", "부트캠프", "동아리·커뮤니티", "컨퍼런스·박람회", "해커톤"
- `status` and `events[].type` follow the user's canonical classification below.
- `tags`: Korean keywords for filtering/search
- `url`, `prize`, `description`, `tip`: display fields (Korean)
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

## Update routine (when the user asks to refresh / 최신화)

1. Web-search every activity whose status or dates could have changed (anything not `ended`, plus expected announcements). Verify against official sites.
2. Search for NEW activities to add: hackathons, contests, bootcamps, conferences, expos, IT clubs (SOPT, YAPP, 넥스터즈, 디프만, DND, UMC, 큐시즘...), government programs. Include everything; the web UI filters by tags.
3. Update `data/activities.json`: bump `updated`, flip statuses, add confirmed dates to `events`, add new activities, keep `ended` items (history).
4. Regenerate the markdown: `python tools/build_md.py`
5. Commit and push (English commit message, see conventions below).

## Conventions

- Everything committed to GitHub is written in **English**: commit messages, README, code comments, scripts.
- Korean stays in: user-facing UI strings, activity data content (names, descriptions, tips, tags).
- Commit messages: short imperative subject, e.g. `Update activity data (2026-08-01)` or `Add hackathon category filter`.
- No build tools, no npm, no frameworks. Keep it vanilla.
