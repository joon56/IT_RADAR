/* IT RADAR - vanilla JS app. Loads data/activities.json, renders calendar, timeline, list.
   Bilingual ko/en. Personal state (bookmarks, language, last visit) lives in localStorage only. */
(function () {
  "use strict";

  const SITE = "https://joon56.github.io/IT_RADAR";
  const ICS_URL = SITE + "/calendar.ics";

  const COLOR_BY_TYPE = {
    apply_start: "green",
    apply_end: "red",
    activity_start: "blue",
    partial_deadline: "orange",
    activity_end: "slate",
    announce: "purple",
  };
  const DEADLINE_TYPES = ["apply_end", "partial_deadline"];
  const STATUS_ORDER = { applying: 0, ongoing_open: 1, upcoming: 2, ongoing_closed: 3, ended: 4 };

  const I18N = {
    ko: {
      tab_calendar: "캘린더",
      tab_timeline: "타임라인",
      tab_list: "목록",
      updated: "업데이트",
      today: "오늘",
      banner_title: "⚡ 마감 임박 (7일 이내)",
      due_today: "오늘",
      due_today_badge: "오늘 마감",
      day_events: "이 날의 일정",
      day_applying: "이 날 신청 진행 중",
      no_events: "일정 없음",
      no_applying: "신청 기간에 해당하는 활동 없음",
      panel_hint: "날짜를 클릭하면 해당일의 일정과 신청 진행 중인 활동을 보여줍니다.",
      deadline_suffix: "마감",
      search_placeholder: "활동명·태그 검색",
      all: "전체",
      all_categories: "전체 분야",
      results: (n) => `${n}개 활동`,
      footer: "일정은 주최 측 사정에 따라 변경될 수 있습니다. 지원 전 공식 사이트에서 확인하세요.",
      load_error: "데이터 로드 실패",
      weekdays: ["일", "월", "화", "수", "목", "금", "토"],
      month_title: (y, m) => `${y}년 ${m}월`,
      month_short: (m) => `${m}월`,
      fmt_date: (m, d, wd) => `${m}.${String(d).padStart(2, "0")} (${wd})`,
      subscribe_google: "Google 캘린더 구독",
      subscribe_webcal: "Apple·Outlook 구독",
      copy_ics: "ICS URL 복사",
      copied: "복사됨!",
      my_dday: "⭐ 내 활동 D-day",
      my_dday_empty: "카드의 별표(☆)를 누르면 내 활동으로 저장되고, 마감이 여기에 모입니다. 저장은 이 브라우저에만 됩니다.",
      download_my_ics: "내 활동 .ics 다운로드",
      chip_my: "⭐ 내 활동",
      chip_new: "🆕 NEW",
      badge_new: "NEW",
      changelog_title: "최근 변경 사항",
      no_timeline: "표시할 일정이 없습니다.",
      tl_range_note: "이번 달부터 6개월",
      tl_apply_span: "신청 기간",
      tl_activity_span: "대회·활동 기간",
      tl_today: "오늘",
      tab_roadmap: "로드맵",
      tab_briefing: "브리핑",
      roadmap_intro: "목표를 고르면 어떤 활동을 어떤 순서로 하면 되는지 보여줍니다. 각 단계는 실제 활동과 연결되어 있습니다.",
      briefing_intro: "데이터가 갱신될 때마다 자동 생성되는 요약입니다. RSS로 구독할 수 있습니다.",
      checklist_label: "준비 체크리스트",
      links_label: "관련 자료",
      link_google: "구글 후기 검색",
      link_velog: "Velog",
      link_youtube: "YouTube",
      brief_new: "신규",
      brief_change: "변경",
      brief_deadline: "마감",
      no_briefing: "아직 브리핑이 없습니다.",
      status: {
        applying: "🟢 신청 중",
        ongoing_open: "🟢 진행중 (참가 가능)",
        upcoming: "🔵 접수 예정",
        ongoing_closed: "🟡 진행중 (참가 불가)",
        ended: "⚫ 종료",
      },
      types: {
        apply_start: "신청 시작",
        apply_end: "신청 마감",
        activity_start: "대회 시작",
        partial_deadline: "부분 제출 마감",
        activity_end: "활동 종료",
        announce: "발표",
      },
    },
    en: {
      tab_calendar: "Calendar",
      tab_timeline: "Timeline",
      tab_list: "List",
      updated: "Updated",
      today: "Today",
      banner_title: "⚡ Closing soon (within 7 days)",
      due_today: "Today",
      due_today_badge: "Due today",
      day_events: "Events on this day",
      day_applying: "Accepting applications on this day",
      no_events: "No events",
      no_applying: "No activities in their application window",
      panel_hint: "Click a date to see its events and activities currently accepting applications.",
      deadline_suffix: "deadline",
      search_placeholder: "Search name or tags",
      all: "All",
      all_categories: "All categories",
      results: (n) => `${n} activities`,
      footer: "Schedules may change at organizers' discretion. Confirm on the official site before applying.",
      load_error: "Failed to load data",
      weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      month_title: (y, m) => `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1]} ${y}`,
      month_short: (m) => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1],
      fmt_date: (m, d, wd) => `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1]} ${d} (${wd})`,
      subscribe_google: "Subscribe (Google)",
      subscribe_webcal: "Subscribe (Apple/Outlook)",
      copy_ics: "Copy ICS URL",
      copied: "Copied!",
      my_dday: "⭐ My D-days",
      my_dday_empty: "Star (☆) activities on their cards to collect their deadlines here. Saved in this browser only.",
      download_my_ics: "Download my .ics",
      chip_my: "⭐ My picks",
      chip_new: "🆕 NEW",
      badge_new: "NEW",
      changelog_title: "Recent changes",
      no_timeline: "Nothing to show.",
      tl_range_note: "this month + 6 months",
      tl_apply_span: "Application window",
      tl_activity_span: "Activity period",
      tl_today: "Today",
      tab_roadmap: "Roadmaps",
      tab_briefing: "Briefing",
      roadmap_intro: "Pick a goal to see which activities to do, in what order. Every step links to a real activity.",
      briefing_intro: "Auto-generated summaries for every data refresh. Subscribe via RSS.",
      checklist_label: "Prep checklist",
      links_label: "Related links",
      link_google: "Google reviews",
      link_velog: "Velog",
      link_youtube: "YouTube",
      brief_new: "NEW",
      brief_change: "CHANGED",
      brief_deadline: "DEADLINE",
      no_briefing: "No briefings yet.",
      status: {
        applying: "🟢 Applying now",
        ongoing_open: "🟢 Ongoing (joinable)",
        upcoming: "🔵 Opening soon",
        ongoing_closed: "🟡 Ongoing (closed)",
        ended: "⚫ Ended",
      },
      types: {
        apply_start: "Applications open",
        apply_end: "Application deadline",
        activity_start: "Competition starts",
        partial_deadline: "Partial submission due",
        activity_end: "Activity ends",
        announce: "Results",
      },
    },
  };

  const CATEGORY_EN = {
    "SW·웹 개발": "SW · Web Dev",
    "AI/ML 글로벌": "AI/ML Global",
    "AI/ML 국내": "AI/ML Korea",
    "학술 챌린지": "Academic Challenges",
    "의료·과학 AI": "Medical · Science AI",
    "알고리즘": "Algorithms",
    "부트캠프": "Bootcamps",
    "동아리·커뮤니티": "Clubs · Community",
    "컨퍼런스·박람회": "Conferences · Expos",
    "해커톤": "Hackathons",
  };

  let DATA = null;
  let lang = localStorage.getItem("itradar_lang") || "ko";
  let bookmarks = JSON.parse(localStorage.getItem("itradar_bookmarks") || "[]");
  let checks = JSON.parse(localStorage.getItem("itradar_checks") || "{}");
  let newIds = new Set();
  let calYear, calMonth;
  let selectedDate = null;
  let currentView = "calendar";
  let filterStatus = "all";
  let filterCategory = "all";
  let searchQuery = "";

  const $ = (sel) => document.querySelector(sel);
  const t = () => I18N[lang];

  function f(obj, field) {
    if (lang === "en" && obj[field + "_en"]) return obj[field + "_en"];
    return obj[field];
  }
  function evLabel(ev) {
    if (lang === "en") return ev.label_en || ev.label || t().types[ev.type];
    return ev.label || t().types[ev.type];
  }
  function catLabel(c) {
    return lang === "en" ? CATEGORY_EN[c] || c : c;
  }

  function todayStr() {
    return toDateStr(new Date());
  }
  function toDateStr(d) {
    return (
      d.getFullYear() +
      "-" +
      String(d.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getDate()).padStart(2, "0")
    );
  }
  function daysUntil(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const target = new Date(y, m - 1, d);
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return Math.round((target - base) / 86400000);
  }
  function fmtDate(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const wd = t().weekdays[new Date(y, m - 1, d).getDay()];
    return t().fmt_date(m, d, wd);
  }

  /* ---------- Data helpers ---------- */

  function allEvents() {
    const out = [];
    for (const a of DATA.activities) {
      for (const ev of a.events || []) out.push({ ...ev, activity: a });
    }
    return out;
  }

  function nextDeadline(a) {
    const future = (a.events || [])
      .filter((e) => DEADLINE_TYPES.includes(e.type) && daysUntil(e.date) >= 0)
      .sort((x, y) => x.date.localeCompare(y.date));
    return future[0] || null;
  }

  function applyingOn(dateStr) {
    return DATA.activities.filter((a) => {
      const starts = (a.events || []).filter((e) => e.type === "apply_start");
      const ends = (a.events || []).filter((e) => e.type === "apply_end");
      if (!ends.length) return false;
      const start = starts.length ? starts[0].date : null;
      const end = ends[ends.length - 1].date;
      if (start) return start <= dateStr && dateStr <= end;
      return dateStr <= end && (a.status === "applying" || a.status === "ongoing_open");
    });
  }

  function isBookmarked(id) {
    return bookmarks.includes(id);
  }
  function toggleBookmark(id) {
    bookmarks = isBookmarked(id) ? bookmarks.filter((x) => x !== id) : [...bookmarks, id];
    localStorage.setItem("itradar_bookmarks", JSON.stringify(bookmarks));
    renderMyDday();
    renderList();
  }

  /* ---------- URL hash sync ---------- */

  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    if (p.get("view")) currentView = p.get("view");
    if (p.get("status")) filterStatus = p.get("status");
    if (p.get("cat")) filterCategory = p.get("cat");
    if (p.get("q")) searchQuery = p.get("q");
  }
  function writeHash() {
    const p = new URLSearchParams();
    if (currentView !== "calendar") p.set("view", currentView);
    if (filterStatus !== "all") p.set("status", filterStatus);
    if (filterCategory !== "all") p.set("cat", filterCategory);
    if (searchQuery.trim()) p.set("q", searchQuery.trim());
    const h = p.toString();
    history.replaceState(null, "", h ? "#" + h : location.pathname + location.search);
  }

  /* ---------- View switching ---------- */

  function setView(view) {
    currentView = view;
    document.querySelectorAll(".tab").forEach((x) => {
      const on = x.dataset.view === view;
      x.classList.toggle("active", on);
      x.setAttribute("aria-selected", String(on));
    });
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    $("#view-" + view).classList.add("active");
    writeHash();
  }

  /* ---------- Static chrome ---------- */

  function renderChrome() {
    $("#updated-badge").textContent = `${t().updated} ${DATA.updated}`;
    document.querySelector('[data-view="calendar"]').textContent = t().tab_calendar;
    document.querySelector('[data-view="timeline"]').textContent = t().tab_timeline;
    document.querySelector('[data-view="list"]').textContent = t().tab_list;
    document.querySelector('[data-view="roadmap"]').textContent = t().tab_roadmap;
    document.querySelector('[data-view="briefing"]').textContent = t().tab_briefing;
    $("#roadmap-intro").textContent = t().roadmap_intro;
    $("#briefing-intro").textContent = t().briefing_intro;
    $("#cal-today").textContent = t().today;
    $("#search-input").placeholder = t().search_placeholder;
    $("#search-input").value = searchQuery;
    $("#footer-text").textContent = t().footer;

    // Subscribe bar
    const googleUrl = "https://calendar.google.com/calendar/render?cid=" + encodeURIComponent(ICS_URL);
    const webcalUrl = ICS_URL.replace(/^https:/, "webcal:");
    $("#subscribe-bar").innerHTML =
      `<a class="sub-btn" href="${googleUrl}" target="_blank" rel="noopener">📅 ${t().subscribe_google}</a>` +
      `<a class="sub-btn" href="${webcalUrl}">🍎 ${t().subscribe_webcal}</a>` +
      `<button class="sub-btn" id="copy-ics">🔗 ${t().copy_ics}</button>`;
    $("#copy-ics").addEventListener("click", () => {
      navigator.clipboard.writeText(ICS_URL).then(() => {
        $("#copy-ics").textContent = "✓ " + t().copied;
        setTimeout(() => ($("#copy-ics").innerHTML = "🔗 " + t().copy_ics), 1500);
      });
    });

    // Legend
    const legendTypes = ["apply_start", "apply_end", "activity_start", "partial_deadline", "activity_end", "announce"];
    $("#cal-legend").innerHTML = legendTypes
      .map((ty) => `<span class="legend-item"><i class="dot dot-${COLOR_BY_TYPE[ty]}"></i>${t().types[ty]}</span>`)
      .join("");

    // Status chips (+ special: my picks, new)
    const statuses = ["applying", "ongoing_open", "upcoming", "ongoing_closed", "ended"];
    let chipsHtml =
      `<button class="chip" data-status="all">${t().all}</button>` +
      `<button class="chip chip-special" data-status="my">${t().chip_my}</button>`;
    if (newIds.size) {
      chipsHtml += `<button class="chip chip-special" data-status="new">${t().chip_new} (${newIds.size})</button>`;
    }
    chipsHtml += statuses
      .map((s) => `<button class="chip" data-status="${s}">${t().status[s]}</button>`)
      .join("");
    $("#status-chips").innerHTML = chipsHtml;
    $("#status-chips").querySelectorAll(".chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.status === filterStatus);
      chip.addEventListener("click", () => {
        filterStatus = chip.dataset.status;
        $("#status-chips").querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        writeHash();
        renderList();
      });
    });

    // Category chips
    const cats = [...new Set(DATA.activities.map((a) => a.category))];
    $("#category-chips").innerHTML =
      `<button class="chip" data-category="all">${t().all_categories}</button>` +
      cats.map((c) => `<button class="chip" data-category="${c}">${catLabel(c)}</button>`).join("");
    $("#category-chips").querySelectorAll(".chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.category === filterCategory);
      chip.addEventListener("click", () => {
        filterCategory = chip.dataset.category;
        $("#category-chips").querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        writeHash();
        renderList();
      });
    });

    // Changelog
    const log = DATA.changelog || [];
    const clWrap = $("#changelog");
    if (log.length) {
      clWrap.hidden = false;
      clWrap.innerHTML =
        `<summary>${t().changelog_title}</summary>` +
        log
          .slice(0, 5)
          .map(
            (entry) =>
              `<div class="cl-entry"><span class="cl-date">${entry.date}</span><ul>` +
              entry.changes.map((c) => `<li>${lang === "en" && c.note_en ? c.note_en : c.note}</li>`).join("") +
              `</ul></div>`
          )
          .join("");
    } else {
      clWrap.hidden = true;
    }

    // Lang toggle state
    document.querySelectorAll(".lang-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.lang === lang);
    });
  }

  /* ---------- Deadline banner ---------- */

  function renderBanner() {
    const banner = $("#deadline-banner");
    const items = [];
    for (const a of DATA.activities) {
      for (const ev of a.events || []) {
        if (!DEADLINE_TYPES.includes(ev.type)) continue;
        const dd = daysUntil(ev.date);
        if (dd >= 0 && dd <= 7) items.push({ a, ev, dd });
      }
    }
    if (!items.length) {
      banner.hidden = true;
      return;
    }
    items.sort((x, y) => x.dd - y.dd);
    banner.hidden = false;
    banner.innerHTML =
      `<h3>${t().banner_title}</h3><ul>` +
      items
        .map(
          (it) =>
            `<li><span class="dday">${it.dd === 0 ? t().due_today : "D-" + it.dd}</span>` +
            `<a href="${it.a.url}" target="_blank" rel="noopener">${f(it.a, "name")}</a>` +
            ` <span style="color:var(--text-dim)">${fmtDate(it.ev.date)} · ${evLabel(it.ev)}</span></li>`
        )
        .join("") +
      `</ul>`;
  }

  /* ---------- My D-day strip ---------- */

  function renderMyDday() {
    const wrap = $("#my-dday");
    if (!bookmarks.length) {
      wrap.hidden = true;
      return;
    }
    wrap.hidden = false;
    const acts = DATA.activities.filter((a) => isBookmarked(a.id));
    const items = [];
    for (const a of acts) {
      for (const ev of a.events || []) {
        if (!DEADLINE_TYPES.includes(ev.type)) continue;
        const dd = daysUntil(ev.date);
        if (dd >= 0) items.push({ a, ev, dd });
      }
    }
    items.sort((x, y) => x.dd - y.dd);
    let html = `<div class="my-dday-head"><h3>${t().my_dday}</h3>` +
      `<button class="sub-btn" id="dl-my-ics">⬇ ${t().download_my_ics}</button></div>`;
    if (items.length) {
      html += `<ul>` +
        items
          .map(
            (it) =>
              `<li><span class="dday ${it.dd <= 3 ? "u" : it.dd <= 7 ? "s" : ""}">${it.dd === 0 ? t().due_today : "D-" + it.dd}</span>` +
              `<a href="${it.a.url}" target="_blank" rel="noopener">${f(it.a, "name")}</a>` +
              ` <span style="color:var(--text-dim)">${fmtDate(it.ev.date)} · ${evLabel(it.ev)}</span></li>`
          )
          .join("") +
        `</ul>`;
    } else {
      html += `<p class="day-panel-empty">${t().my_dday_empty}</p>`;
    }
    wrap.innerHTML = html;
    $("#dl-my-ics").addEventListener("click", downloadMyIcs);
  }

  function downloadMyIcs() {
    const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z/, "Z");
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//IT RADAR//my//KO",
      "CALSCALE:GREGORIAN", "X-WR-CALNAME:IT RADAR (my picks)",
    ];
    const emoji = { apply_start: "🟢", apply_end: "🔴", activity_start: "🔵", partial_deadline: "🟠", activity_end: "⚪", announce: "🟣" };
    for (const a of DATA.activities.filter((x) => isBookmarked(x.id))) {
      for (const ev of a.events || []) {
        const d = ev.date.replace(/-/g, "");
        const next = new Date(ev.date);
        next.setDate(next.getDate() + 1);
        lines.push(
          "BEGIN:VEVENT",
          `UID:itradar-my-${a.id}-${ev.type}-${ev.date}@joon56.github.io`,
          `DTSTAMP:${stamp}`,
          `DTSTART;VALUE=DATE:${d}`,
          `DTEND;VALUE=DATE:${toDateStr(next).replace(/-/g, "")}`,
          `SUMMARY:${esc(`${emoji[ev.type] || ""} ${f(a, "name")} — ${evLabel(ev)}`)}`,
          `URL:${a.url || ""}`,
          "END:VEVENT"
        );
      }
    }
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "it-radar-my.ics";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /* ---------- Calendar ---------- */

  function renderWeekdays() {
    $("#cal-weekdays").innerHTML = t()
      .weekdays.map(
        (n, i) => `<div class="weekday ${i === 0 ? "sun" : i === 6 ? "sat" : ""}">${n}</div>`
      )
      .join("");
  }

  function renderCalendar() {
    $("#cal-title").textContent = t().month_title(calYear, calMonth + 1);

    const evByDate = {};
    for (const ev of allEvents()) {
      (evByDate[ev.date] = evByDate[ev.date] || []).push(ev);
    }

    const first = new Date(calYear, calMonth, 1);
    const startOffset = first.getDay();
    const gridStart = new Date(calYear, calMonth, 1 - startOffset);
    const today = todayStr();

    let html = "";
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const ds = toDateStr(d);
      const inMonth = d.getMonth() === calMonth;
      const dow = d.getDay();
      const evs = evByDate[ds] || [];
      const chips = evs
        .slice(0, 3)
        .map(
          (e) =>
            `<span class="cell-chip cc-${COLOR_BY_TYPE[e.type] || "slate"}" title="${f(e.activity, "name")} · ${evLabel(e)}">${f(e.activity, "name")}</span>`
        )
        .join("");
      const more = evs.length > 3 ? `<span class="day-more">+${evs.length - 3}</span>` : "";
      const cls = [
        "day-cell",
        inMonth ? "" : "out-month",
        ds === today ? "today" : "",
        ds === selectedDate ? "selected" : "",
        dow === 0 ? "sun" : dow === 6 ? "sat" : "",
      ]
        .filter(Boolean)
        .join(" ");
      html += `<button class="${cls}" data-date="${ds}"><span class="day-num">${d.getDate()}</span><span class="day-events">${chips}${more}</span></button>`;
    }
    $("#cal-days").innerHTML = html;

    $("#cal-days")
      .querySelectorAll(".day-cell")
      .forEach((cell) =>
        cell.addEventListener("click", () => {
          selectedDate = cell.dataset.date;
          renderCalendar();
          renderDayPanel(selectedDate);
        })
      );
  }

  function renderDayPanel(dateStr) {
    const panel = $("#day-panel");
    if (!dateStr) {
      panel.innerHTML = `<p class="day-panel-empty">${t().panel_hint}</p>`;
      return;
    }
    const evs = allEvents().filter((e) => e.date === dateStr);
    const applying = applyingOn(dateStr);

    let html = `<h3>${lang === "ko" ? dateStr.slice(0, 4) + "년 " : ""}${fmtDate(dateStr)}${lang === "en" ? ", " + dateStr.slice(0, 4) : ""}</h3>`;

    let evHtml = `<h4>${t().day_events} (${evs.length})</h4>`;
    if (evs.length) {
      evHtml += evs
        .map(
          (e) =>
            `<div class="panel-event"><i class="dot dot-${COLOR_BY_TYPE[e.type] || "slate"}"></i>` +
            `<div><a href="${e.activity.url}" target="_blank" rel="noopener">${f(e.activity, "name")}</a>` +
            `<span class="ev-label">${evLabel(e)}</span></div></div>`
        )
        .join("");
    } else {
      evHtml += `<p class="day-panel-empty">${t().no_events}</p>`;
    }

    let apHtml = `<h4>${t().day_applying} (${applying.length})</h4>`;
    if (applying.length) {
      apHtml += applying
        .map((a) => {
          const dl = (a.events || []).filter((e) => e.type === "apply_end").slice(-1)[0];
          return (
            `<div class="panel-ongoing"><a href="${a.url}" target="_blank" rel="noopener">${f(a, "name")}</a>` +
            `<span class="sub">~${fmtDate(dl.date)} ${t().deadline_suffix}</span></div>`
          );
        })
        .join("");
    } else {
      apHtml += `<p class="day-panel-empty">${t().no_applying}</p>`;
    }

    panel.innerHTML = html + `<div class="panel-columns"><div>${evHtml}</div><div>${apHtml}</div></div>`;
  }

  /* ---------- Timeline ---------- */

  function renderTimeline() {
    // Legend: what each bar/marker shape and color means
    $("#tl-legend").innerHTML = [
      `<span class="legend-item"><i class="sw-bar swb-green"></i>${t().tl_apply_span}</span>`,
      `<span class="legend-item"><i class="sw-bar swb-blue"></i>${t().tl_activity_span}</span>`,
      `<span class="legend-item"><i class="sw-diamond tlm-red"></i>${t().types.apply_end}</span>`,
      `<span class="legend-item"><i class="sw-diamond tlm-orange"></i>${t().types.partial_deadline}</span>`,
      `<span class="legend-item"><i class="dot dot-green"></i>${t().types.apply_start}</span>`,
      `<span class="legend-item"><i class="dot dot-blue"></i>${t().types.activity_start}</span>`,
      `<span class="legend-item"><i class="dot dot-slate"></i>${t().types.activity_end}</span>`,
      `<span class="legend-item"><i class="dot dot-purple"></i>${t().types.announce}</span>`,
      `<span class="legend-item"><i class="sw-today"></i>${t().tl_today}</span>`,
    ].join("");

    const wrap = $("#timeline-body");
    const now = new Date();
    const rangeStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 7, 1);
    const total = rangeEnd - rangeStart;
    const pct = (d) => Math.max(0, Math.min(100, ((d - rangeStart) / total) * 100));
    const parse = (s) => {
      const [y, m, d] = s.split("-").map(Number);
      return new Date(y, m - 1, d);
    };

    // Month axis
    const months = [];
    for (let i = 0; i < 7; i++) {
      const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(`<div class="tl-month" style="left:${pct(m)}%">${t().month_short(m.getMonth() + 1)}</div>`);
    }
    const todayLine = `<div class="tl-today" style="left:${pct(now)}%"></div>`;

    // Rows: activities with at least one event in range
    const rows = [];
    for (const a of DATA.activities) {
      const evs = (a.events || []).filter((e) => {
        const d = parse(e.date);
        return d >= rangeStart && d < rangeEnd;
      });
      const applyStart = (a.events || []).find((e) => e.type === "apply_start");
      const applyEnd = (a.events || []).filter((e) => e.type === "apply_end").slice(-1)[0];
      const actStarts = (a.events || []).filter((e) => e.type === "activity_start");
      const actEnd = (a.events || []).filter((e) => e.type === "activity_end").slice(-1)[0];

      const spanIntersects = (s, e) => s && e && parse(s.date) < rangeEnd && parse(e.date) >= rangeStart;
      const hasApplySpan = spanIntersects(applyStart, applyEnd);
      const hasActSpan = actStarts.length === 1 && actEnd && spanIntersects(actStarts[0], actEnd);
      if (!evs.length && !hasApplySpan && !hasActSpan) continue;

      let bars = "";
      if (hasApplySpan) {
        const l = pct(parse(applyStart.date));
        const r = pct(parse(applyEnd.date));
        bars += `<div class="tl-bar tlb-green" style="left:${l}%;width:${Math.max(r - l, 0.8)}%" title="${t().types.apply_start} ${applyStart.date} ~ ${applyEnd.date}"></div>`;
      }
      if (hasActSpan) {
        const l = pct(parse(actStarts[0].date));
        const r = pct(parse(actEnd.date));
        bars += `<div class="tl-bar tlb-blue" style="left:${l}%;width:${Math.max(r - l, 0.8)}%" title="${actStarts[0].date} ~ ${actEnd.date}"></div>`;
      }
      // Point markers for everything in range not covered by a span
      for (const e of evs) {
        if (hasApplySpan && (e.type === "apply_start" || e.type === "apply_end")) {
          if (e.type === "apply_end" && e !== applyEnd) { /* keep extra deadlines */ } else continue;
        }
        if (hasActSpan && (e === actStarts[0] || e === actEnd)) continue;
        const shape = DEADLINE_TYPES.includes(e.type) ? "tl-diamond" : "tl-dot-mark";
        bars += `<div class="${shape} tlm-${COLOR_BY_TYPE[e.type]}" style="left:${pct(parse(e.date))}%" title="${evLabel(e)} · ${fmtDate(e.date)}"></div>`;
      }

      const dl = nextDeadline(a);
      const sortKey = evs.length ? Math.min(...evs.map((e) => parse(e.date).getTime())) : parse((applyEnd || actEnd).date).getTime();
      rows.push({
        sortKey,
        html:
          `<div class="tl-row"><div class="tl-name">` +
          `<a href="${a.url}" target="_blank" rel="noopener">${f(a, "name")}</a>` +
          (dl ? `<span class="tl-dd">D-${daysUntil(dl.date)}</span>` : "") +
          `</div><div class="tl-track">${todayLine}${bars}</div></div>`,
      });
    }
    rows.sort((x, y) => x.sortKey - y.sortKey);

    $("#timeline-axis").innerHTML = `<div class="tl-name tl-range">${t().tl_range_note}</div><div class="tl-track tl-axis-track">${todayLine}${months.join("")}</div>`;
    wrap.innerHTML = rows.length
      ? rows.map((r) => r.html).join("")
      : `<p class="day-panel-empty" style="padding:16px">${t().no_timeline}</p>`;
  }

  /* ---------- Roadmaps ---------- */

  function renderRoadmaps() {
    const byId = Object.fromEntries(DATA.activities.map((a) => [a.id, a]));
    $("#roadmap-body").innerHTML = (DATA.roadmaps || [])
      .map((r) => {
        const steps = r.steps
          .map((s) => {
            const a = byId[s.activityId];
            if (!a) return "";
            const dl = nextDeadline(a);
            return (
              `<div class="rm-step">` +
              `<span class="rm-phase">${lang === "en" ? s.phase_en : s.phase}</span>` +
              `<a class="rm-name" href="${a.url}" target="_blank" rel="noopener">${f(a, "name")}</a>` +
              `<span class="badge badge-status-${a.status}">${t().status[a.status]}</span>` +
              (dl ? `<span class="rm-dd">D-${daysUntil(dl.date)}</span>` : "") +
              `<p class="rm-note">${lang === "en" ? s.note_en : s.note}</p>` +
              `</div>`
            );
          })
          .join(`<div class="rm-arrow">→</div>`);
        return (
          `<section class="roadmap">` +
          `<h3>${f(r, "title")}</h3>` +
          `<p class="rm-desc">${f(r, "description")}</p>` +
          `<div class="rm-flow">${steps}</div>` +
          `</section>`
        );
      })
      .join("");
  }

  /* ---------- Briefings ---------- */

  function renderBriefings() {
    const list = DATA.briefings || [];
    if (!list.length) {
      $("#briefing-body").innerHTML = `<p class="day-panel-empty">${t().no_briefing}</p>`;
      return;
    }
    const kindLabel = { new: t().brief_new, change: t().brief_change, deadline: t().brief_deadline };
    $("#briefing-body").innerHTML = list
      .map(
        (b, i) =>
          `<details class="briefing" ${i === 0 ? "open" : ""}>` +
          `<summary><span class="bf-date">${b.date}</span> ${lang === "en" ? b.summary_en : b.summary}</summary>` +
          `<ul>` +
          b.items
            .map(
              (it) =>
                `<li><span class="bf-kind bf-${it.kind}">${kindLabel[it.kind] || ""}</span>${lang === "en" ? it.text_en : it.text}</li>`
            )
            .join("") +
          `</ul></details>`
      )
      .join("");
  }

  /* ---------- List ---------- */

  function ddayBadge(a) {
    const dl = nextDeadline(a);
    if (!dl) return "";
    const dd = daysUntil(dl.date);
    const cls = dd <= 3 ? "dday-urgent" : dd <= 7 ? "dday-soon" : "dday-normal";
    const txt = dd === 0 ? t().due_today_badge : `D-${dd}`;
    return `<span class="dday-badge ${cls}" title="${fmtDate(dl.date)} ${evLabel(dl)}">${txt}</span>`;
  }

  function scheduleSummary(a) {
    if (a.events && a.events.length) {
      return a.events
        .map((e) => `${evLabel(e)} ${e.date.slice(5).replace("-", ".")}`)
        .join(" · ");
    }
    return f(a, "schedule_note") || "";
  }

  // Auto search links (always valid) + curated links from data
  function linksRow(a) {
    const q = encodeURIComponent(a.name);
    const auto = [
      { title: t().link_google, url: `https://www.google.com/search?q=${q}+%ED%9B%84%EA%B8%B0` },
      { title: t().link_velog, url: `https://velog.io/search?q=${q}` },
      { title: t().link_youtube, url: `https://www.youtube.com/results?search_query=${q}` },
    ];
    const curated = (a.links || []).map((l) => ({ title: lang === "en" ? l.title_en || l.title : l.title, url: l.url }));
    return (
      `<div class="link-row"><span class="link-label">${t().links_label}</span>` +
      [...curated, ...auto]
        .map((l) => `<a class="link-chip" href="${l.url}" target="_blank" rel="noopener">${l.title}</a>`)
        .join("") +
      `</div>`
    );
  }

  function checklistBlock(a) {
    if (!a.checklist || !a.checklist.length) return "";
    const done = new Set(checks[a.id] || []);
    const items = a.checklist
      .map(
        (c, i) =>
          `<label class="ck-item"><input type="checkbox" data-id="${a.id}" data-idx="${i}" ${done.has(i) ? "checked" : ""}>` +
          `<span class="${done.has(i) ? "ck-done" : ""}">${lang === "en" ? c.item_en || c.item : c.item}</span></label>`
      )
      .join("");
    return (
      `<details class="checklist"${done.size ? " open" : ""}>` +
      `<summary>${t().checklist_label} (${done.size}/${a.checklist.length})</summary>${items}</details>`
    );
  }

  function renderList() {
    const q = searchQuery.trim().toLowerCase();
    let items = DATA.activities.filter((a) => {
      if (filterStatus === "my") {
        if (!isBookmarked(a.id)) return false;
      } else if (filterStatus === "new") {
        if (!newIds.has(a.id)) return false;
      } else if (filterStatus !== "all" && a.status !== filterStatus) {
        return false;
      }
      if (filterCategory !== "all" && a.category !== filterCategory) return false;
      if (q) {
        const hay = (
          a.name + " " + (a.name_en || "") + " " + a.category + " " +
          (a.tags || []).join(" ") + " " + (a.tags_en || []).join(" ") + " " +
          (a.description || "") + " " + (a.description_en || "")
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    items.sort((x, y) => {
      const so = STATUS_ORDER[x.status] - STATUS_ORDER[y.status];
      if (so !== 0) return so;
      const dx = nextDeadline(x), dy = nextDeadline(y);
      if (dx && dy) return dx.date.localeCompare(dy.date);
      if (dx) return -1;
      if (dy) return 1;
      return 0;
    });

    $("#result-count").textContent = t().results(items.length);
    $("#card-grid").innerHTML = items
      .map(
        (a) => `
      <article class="card">
        <div class="card-top">
          <h3 class="card-title">${newIds.has(a.id) ? `<span class="new-badge">${t().badge_new}</span>` : ""}<a href="${a.url}" target="_blank" rel="noopener">${f(a, "name")}<span class="ext">↗</span></a></h3>
          <div class="card-top-right">
            ${ddayBadge(a)}
            <button class="star ${isBookmarked(a.id) ? "on" : ""}" data-id="${a.id}" title="${t().chip_my}">${isBookmarked(a.id) ? "★" : "☆"}</button>
          </div>
        </div>
        <div class="badge-row">
          <span class="badge badge-status-${a.status}">${t().status[a.status]}</span>
          <span class="badge">${catLabel(a.category)}</span>
        </div>
        <p class="card-desc">${f(a, "description") || ""}</p>
        ${f(a, "prize") ? `<p class="card-prize">${f(a, "prize")}</p>` : ""}
        ${scheduleSummary(a) ? `<p class="card-schedule">${scheduleSummary(a)}</p>` : ""}
        ${f(a, "tip") ? `<p class="card-tip">${f(a, "tip")}</p>` : ""}
        ${checklistBlock(a)}
        ${linksRow(a)}
        <div class="tag-row">${(f(a, "tags") || []).map((x) => `<span class="tag">${x}</span>`).join("")}</div>
      </article>`
      )
      .join("");

    $("#card-grid").querySelectorAll(".star").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        toggleBookmark(btn.dataset.id);
      })
    );

    $("#card-grid").querySelectorAll(".ck-item input").forEach((box) =>
      box.addEventListener("change", () => {
        const id = box.dataset.id;
        const idx = Number(box.dataset.idx);
        const set = new Set(checks[id] || []);
        box.checked ? set.add(idx) : set.delete(idx);
        checks[id] = [...set];
        localStorage.setItem("itradar_checks", JSON.stringify(checks));
        renderList();
      })
    );
  }

  /* ---------- Render all ---------- */

  function renderAll() {
    renderChrome();
    renderWeekdays();
    renderBanner();
    renderMyDday();
    renderCalendar();
    renderDayPanel(selectedDate);
    renderTimeline();
    renderRoadmaps();
    renderBriefings();
    renderList();
  }

  /* ---------- Controls ---------- */

  function bindControls() {
    document.querySelectorAll(".tab").forEach((tab) =>
      tab.addEventListener("click", () => setView(tab.dataset.view))
    );

    document.querySelectorAll(".lang-btn").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (btn.dataset.lang === lang) return;
        lang = btn.dataset.lang;
        localStorage.setItem("itradar_lang", lang);
        document.documentElement.lang = lang;
        renderAll();
      })
    );

    $("#cal-prev").addEventListener("click", () => {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      renderCalendar();
    });
    $("#cal-next").addEventListener("click", () => {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      renderCalendar();
    });
    $("#cal-today").addEventListener("click", () => {
      const now = new Date();
      calYear = now.getFullYear();
      calMonth = now.getMonth();
      selectedDate = todayStr();
      renderCalendar();
      renderDayPanel(selectedDate);
    });

    $("#search-input").addEventListener("input", (e) => {
      searchQuery = e.target.value;
      writeHash();
      renderList();
    });

    // Keyboard shortcuts: arrows = month nav (calendar), t = today, / = search
    document.addEventListener("keydown", (e) => {
      if (e.target.matches("input, textarea") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (currentView === "calendar") {
        if (e.key === "ArrowLeft") $("#cal-prev").click();
        if (e.key === "ArrowRight") $("#cal-next").click();
        if (e.key === "t" || e.key === "T") $("#cal-today").click();
      }
      if (e.key === "/") {
        e.preventDefault();
        setView("list");
        $("#search-input").focus();
      }
    });
  }

  /* ---------- Init ---------- */

  async function init() {
    const res = await fetch("data/activities.json");
    DATA = await res.json();

    // NEW detection: activities added since the user's last visit (per-browser)
    const lastVisit = localStorage.getItem("itradar_lastvisit");
    if (lastVisit) {
      for (const a of DATA.activities) {
        if (a.added && a.added > lastVisit) newIds.add(a.id);
      }
    }
    localStorage.setItem("itradar_lastvisit", todayStr());

    document.documentElement.lang = lang;
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    selectedDate = todayStr();

    readHash();
    renderAll();
    bindControls();
    setView(currentView);
  }

  init().catch((err) => {
    document.querySelector(".container").innerHTML =
      `<p style="color:var(--red)">${I18N[lang].load_error}: ${err.message}</p>`;
  });
})();
