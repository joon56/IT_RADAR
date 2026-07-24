# IT RADAR

Calendar and list tracker for Korean IT competitions, hackathons, bootcamps, conferences, and developer community activities.

**Live site:** https://joon56.github.io/IT_RADAR/

## Features

- **Calendar view**: monthly grid with color-coded event dots (application open, deadline, activity start). Click a date to see that day's events and activities currently accepting applications.
- **List view**: filter by status, category, and tags; full-text search; D-day badges on upcoming deadlines.
- **Deadline banner**: activities closing within 7 days surface automatically at the top.

## Structure

```
data/activities.json   # single source of truth
index.html             # app shell
css/style.css          # dark theme styles
js/app.js              # calendar + list rendering, no dependencies
tools/build_md.py      # generates docs/IT_activities_master.md from the JSON
CLAUDE.md              # data schema + update routine
```

No build step. Editing `data/activities.json` and pushing is a full deploy.

## Updating data

See the update routine in [CLAUDE.md](CLAUDE.md). In short: verify dates against official sites, update the JSON, run `python tools/build_md.py`, commit, push.

## Disclaimer

Schedules change at organizers' discretion. Always confirm on the official site before applying.
