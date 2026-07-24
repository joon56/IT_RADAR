/* IT RADAR - vanilla JS app. Loads data/activities.json, renders calendar + list.
   Bilingual: ko (default) / en, toggled in the header, persisted in localStorage. */
(function () {
  "use strict";

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
      fmt_date: (m, d, wd) => `${m}.${String(d).padStart(2, "0")} (${wd})`,
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
      fmt_date: (m, d, wd) => `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][m - 1]} ${d} (${wd})`,
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
  let calYear, calMonth;
  let selectedDate = null;
  let filterStatus = "all";
  let filterCategory = "all";
  let searchQuery = "";

  const $ = (sel) => document.querySelector(sel);
  const t = () => I18N[lang];

  // Localized field access with Korean fallback
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

  /* ---------- Static chrome (header, legend, chips, footer) ---------- */

  function renderChrome() {
    $("#updated-badge").textContent = `${t().updated} ${DATA.updated}`;
    document.querySelector('[data-view="calendar"]').textContent = t().tab_calendar;
    document.querySelector('[data-view="list"]').textContent = t().tab_list;
    $("#cal-today").textContent = t().today;
    $("#search-input").placeholder = t().search_placeholder;
    $("#footer-text").textContent = t().footer;

    // Legend
    const legendTypes = ["apply_start", "apply_end", "activity_start", "partial_deadline", "activity_end", "announce"];
    $("#cal-legend").innerHTML = legendTypes
      .map((ty) => `<span class="legend-item"><i class="dot dot-${COLOR_BY_TYPE[ty]}"></i>${t().types[ty]}</span>`)
      .join("");

    // Status chips
    const statuses = ["applying", "ongoing_open", "upcoming", "ongoing_closed", "ended"];
    $("#status-chips").innerHTML =
      `<button class="chip ${filterStatus === "all" ? "active" : ""}" data-status="all">${t().all}</button>` +
      statuses
        .map(
          (s) =>
            `<button class="chip ${filterStatus === s ? "active" : ""}" data-status="${s}">${t().status[s]}</button>`
        )
        .join("");
    $("#status-chips")
      .querySelectorAll(".chip")
      .forEach((chip) =>
        chip.addEventListener("click", () => {
          filterStatus = chip.dataset.status;
          $("#status-chips").querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          renderList();
        })
      );

    // Category chips
    const cats = [...new Set(DATA.activities.map((a) => a.category))];
    $("#category-chips").innerHTML =
      `<button class="chip ${filterCategory === "all" ? "active" : ""}" data-category="all">${t().all_categories}</button>` +
      cats
        .map(
          (c) =>
            `<button class="chip ${filterCategory === c ? "active" : ""}" data-category="${c}">${catLabel(c)}</button>`
        )
        .join("");
    $("#category-chips")
      .querySelectorAll(".chip")
      .forEach((chip) =>
        chip.addEventListener("click", () => {
          filterCategory = chip.dataset.category;
          $("#category-chips").querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
          chip.classList.add("active");
          renderList();
        })
      );

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

  function renderList() {
    const q = searchQuery.trim().toLowerCase();
    let items = DATA.activities.filter((a) => {
      if (filterStatus !== "all" && a.status !== filterStatus) return false;
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
          <h3 class="card-title"><a href="${a.url}" target="_blank" rel="noopener">${f(a, "name")}<span class="ext">↗</span></a></h3>
          ${ddayBadge(a)}
        </div>
        <div class="badge-row">
          <span class="badge badge-status-${a.status}">${t().status[a.status]}</span>
          <span class="badge">${catLabel(a.category)}</span>
        </div>
        <p class="card-desc">${f(a, "description") || ""}</p>
        ${f(a, "prize") ? `<p class="card-prize">${f(a, "prize")}</p>` : ""}
        ${scheduleSummary(a) ? `<p class="card-schedule">${scheduleSummary(a)}</p>` : ""}
        ${f(a, "tip") ? `<p class="card-tip">${f(a, "tip")}</p>` : ""}
        <div class="tag-row">${(f(a, "tags") || []).map((x) => `<span class="tag">${x}</span>`).join("")}</div>
      </article>`
      )
      .join("");
  }

  /* ---------- Render all (used on init and language switch) ---------- */

  function renderAll() {
    renderChrome();
    renderWeekdays();
    renderBanner();
    renderCalendar();
    renderDayPanel(selectedDate);
    renderList();
  }

  /* ---------- Controls ---------- */

  function bindControls() {
    document.querySelectorAll(".tab").forEach((tab) =>
      tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((x) => {
          x.classList.remove("active");
          x.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
        $("#view-" + tab.dataset.view).classList.add("active");
      })
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
      renderList();
    });
  }

  /* ---------- Init ---------- */

  async function init() {
    const res = await fetch("data/activities.json");
    DATA = await res.json();

    document.documentElement.lang = lang;
    const now = new Date();
    calYear = now.getFullYear();
    calMonth = now.getMonth();
    selectedDate = todayStr();

    renderAll();
    bindControls();
  }

  init().catch((err) => {
    document.querySelector(".container").innerHTML =
      `<p style="color:var(--red)">${I18N[lang].load_error}: ${err.message}</p>`;
  });
})();
