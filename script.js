const DEFAULT_DATA = {
  today: [
    "8:00 AM | Kids morning routine",
    "12:00 PM | Lunch / reset",
    "6:00 PM | Family dinner"
  ],
  week: [
    "Mon | Trash prep",
    "Tue | Grocery check",
    "Wed | Family night",
    "Thu | Laundry reset",
    "Fri | Weekend prep",
    "Sat | Errands",
    "Sun | Plan week"
  ],
  keepLists: [
    "🛒 | Grocery List | https://keep.google.com/",
    "✅ | Family To-Do | https://keep.google.com/",
    "🌱 | Garden | https://keep.google.com/",
    "🏡 | Home Projects | https://keep.google.com/",
    "🚗 | Vehicle Maintenance | https://keep.google.com/",
    "👧 | Kids | https://keep.google.com/"
  ],
  ring: [
    "Alarm",
    "Lock + Thermostat",
    "Tap to open Ring"
  ],
  smartthings: [
    "🌡️ | Thermostat | Devices",
    "🔒 | Door Lock | Status",
    "💡 | Lights | Controls",
    "⚙️ | Scenes | Routines"
  ],
  home: [
    "💡 Lights",
    "🎵 Speakers",
    "▶️ Routines",
    "🏠 Rooms"
  ],
  calendarIcsUrl: "",
  links: {
    calendar: "https://calendar.google.com/calendar/u/0/r",
    keepGrocery: "https://keep.google.com/",
    ring: "intent://#Intent;package=com.ringapp;scheme=ring;end",
    smartthings: "intent://#Intent;package=com.samsung.android.oneconnect;scheme=smartthings;end",
    home: "intent://#Intent;package=com.google.android.apps.chromecast.app;scheme=googlehome;end"
  }
};

const STORAGE_KEY = "hoganHomeHubV30";
let data = loadData();
let editingKey = null;

function loadData() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return deepMerge(DEFAULT_DATA, stored || {});
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function deepMerge(base, override) {
  const output = Array.isArray(base) ? [...base] : { ...base };
  for (const key in override) {
    if (override[key] && typeof override[key] === "object" && !Array.isArray(override[key])) {
      output[key] = deepMerge(base[key] || {}, override[key]);
    } else {
      output[key] = override[key];
    }
  }
  return output;
}

function updateClock() {
  const now = new Date();
  document.getElementById("time").textContent = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
  document.getElementById("date").textContent = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric"
  });
}

function render() {
  renderToday();
  renderWeek();
  renderKeepLists();
  renderRing();
  renderSmartThings();
  renderHome();
}

function renderToday() {
  const list = document.getElementById("todayList");
  list.innerHTML = "";
  const todayKey = dateKey(new Date());
  const live = (data.liveEvents || []).filter(e => dateKey(e.start) === todayKey)
    .sort((a, b) => a.start - b.start)
    .slice(0, 5);

  if (live.length) {
    live.forEach(e => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="when">${escapeHtml(e.time || "All day")}</span><span class="what">${escapeHtml(e.title)}</span>`;
      list.appendChild(li);
    });
    return;
  }

  if (data.calendarIcsUrl) {
    list.innerHTML = `<div class="agenda-empty">No events today.</div>`;
    return;
  }

  data.today.slice(0, 4).forEach(item => {
    const [time, ...rest] = item.split("|");
    const li = document.createElement("li");
    li.innerHTML = `<span class="when">${escapeHtml(time.trim())}</span><span class="what">${escapeHtml(rest.join("|").trim() || time.trim())}</span>`;
    list.appendChild(li);
  });
}

function renderWeek(message = "") {
  const box = document.getElementById("weekList");
  box.innerHTML = "";
  if (message) {
    box.innerHTML = `<div class="calendar-message">${escapeHtml(message)}</div>`;
    return;
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const start = startOfWeek(now);
  const eventsByDay = getWeekEventsByDay(start);

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dateKey(d);
    const events = (eventsByDay[key] || []).slice(0, 3);
    const div = document.createElement("div");
    div.className = "day" + (dateKey(d) === dateKey(now) ? " today" : "");
    div.innerHTML = `
      <div class="day-name">${dayNames[d.getDay()]}</div>
      <div class="day-num">${d.getDate()}</div>
      ${events.map(e => `<div class="day-event ${e.allDay ? "all-day" : ""}">${escapeHtml(e.time ? e.time + " " + e.title : e.title)}</div>`).join("")}
    `;
    box.appendChild(div);
  }
}

function renderKeepLists() {
  const box = document.getElementById("keepListButtons");
  box.innerHTML = "";
  const lists = data.keepLists || [];
  if (!lists.length) {
    box.innerHTML = `<div class="keep-list-empty">Tap Edit to add your Google Keep list titles and links.</div>`;
    return;
  }

  lists.slice(0, 9).forEach(item => {
    const [icon = "📝", title = "Keep List", url = data.links.keepGrocery || "https://keep.google.com/"] =
      item.split("|").map(x => x.trim());
    const a = document.createElement("a");
    a.className = "keep-list-button";
    a.href = url || data.links.keepGrocery || "https://keep.google.com/";
    a.innerHTML = `
      <span class="keep-list-icon">${escapeHtml(icon)}</span>
      <span class="keep-list-title">${escapeHtml(title)}</span>
    `;
    a.addEventListener("click", event => event.stopPropagation());
    box.appendChild(a);
  });
}

function renderRing() {
  const box = document.getElementById("ringContent");
  const [status = "Alarm", devices = "Lock + Thermostat", note = "Tap to open Ring"] = data.ring || [];
  box.innerHTML = `
    <div class="control-tile"><span class="control-icon">🛡️</span><span>${escapeHtml(status)}</span></div>
    <div class="control-tile"><span class="control-icon">🔒</span><span>${escapeHtml(devices)}</span></div>
    <div class="control-sub">${escapeHtml(note)}</div>
  `;
}

function renderSmartThings() {
  const box = document.getElementById("smartthingsContent");
  box.innerHTML = "";
  (data.smartthings || []).slice(0, 4).forEach(item => {
    const [icon = "⚙️", name = "Device", sub = "Open"] = item.split("|").map(x => x.trim());
    const div = document.createElement("div");
    div.className = "smartthings-mini-tile";
    div.innerHTML = `
      <div class="smartthings-mini-icon">${escapeHtml(icon)}</div>
      <div class="smartthings-mini-name">${escapeHtml(name)}</div>
      <div class="smartthings-mini-sub">${escapeHtml(sub)}</div>
    `;
    box.appendChild(div);
  });
}

function renderHome() {
  const box = document.getElementById("homeContent");
  box.innerHTML = (data.home || []).slice(0, 4).map(item => `<div class="home-chip">${escapeHtml(item)}</div>`).join("");
}


function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function dateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getWeekEventsByDay(start) {
  const eventsByDay = {};
  const live = data.liveEvents || [];

  if (data.calendarIcsUrl && !live.length) {
    // If a real calendar URL is configured but fetch has not succeeded yet, show empty real calendar state.
    return eventsByDay;
  }

  if (live.length) {
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    live
      .filter(e => e.start >= start && e.start < end)
      .sort((a, b) => a.start - b.start)
      .forEach(e => {
        const key = dateKey(e.start);
        eventsByDay[key] = eventsByDay[key] || [];
        eventsByDay[key].push(e);
      });

    return eventsByDay;
  }

  // Fallback only until a real calendar is connected.
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  data.week.forEach(item => {
    const [day, ...rest] = item.split("|");
    const dayIndex = dayNames.findIndex(x => x.toLowerCase() === day.trim().slice(0,3).toLowerCase());
    if (dayIndex < 0) return;
    const d = new Date(start);
    d.setDate(start.getDate() + dayIndex);
    const key = dateKey(d);
    eventsByDay[key] = eventsByDay[key] || [];
    eventsByDay[key].push({ title: rest.join("|").trim() || item, time: "", allDay: true, start: d });
  });
  return eventsByDay;
}

async function loadLiveCalendar() {
  if (!data.calendarIcsUrl) {
    data.liveEvents = [];
    renderToday();
    renderWeek();
    return;
  }

  try {
    const response = await fetch(data.calendarIcsUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("Calendar fetch failed: " + response.status);
    const ics = await response.text();
    data.liveEvents = parseIcsEvents(ics);
    renderToday();
    renderWeek();
  } catch (err) {
    console.log("Live calendar failed:", err);
    data.liveEvents = [];
    renderToday();
    renderWeek("Calendar could not load. Check the iCal link.");
  }
}

function parseIcsEvents(icsText) {
  const unfolded = icsText.replace(/\r?\n[ \t]/g, "");
  const blocks = unfolded.split("BEGIN:VEVENT").slice(1).map(x => x.split("END:VEVENT")[0]);

  const windowStart = startOfWeek(new Date());
  const windowEnd = new Date(windowStart);
  windowEnd.setDate(windowStart.getDate() + 21);

  const events = [];

  blocks.forEach(block => {
    const summary = cleanIcsText(readIcsValue(block, "SUMMARY") || "Untitled");
    const startRaw = readIcsValue(block, "DTSTART");
    if (!startRaw) return;

    const start = parseIcsDate(startRaw);
    if (!start) return;

    const rrule = readIcsValue(block, "RRULE");
    const exDates = readAllIcsValues(block, "EXDATE").map(parseIcsDate).filter(Boolean).map(dateKey);

    if (rrule) {
      expandRecurring(events, summary, start, startRaw, rrule, exDates, windowStart, windowEnd);
    } else if (start >= windowStart && start < windowEnd) {
      events.push(makeEvent(summary, start, startRaw));
    }
  });

  return events
    .sort((a, b) => a.start - b.start || a.title.localeCompare(b.title))
    .slice(0, 160);
}

function readIcsValue(block, name) {
  const line = block.split(/\r?\n/).find(l => l.startsWith(name + ":") || l.startsWith(name + ";"));
  if (!line) return "";
  return line.substring(line.indexOf(":") + 1).trim();
}

function readAllIcsValues(block, name) {
  return block.split(/\r?\n/)
    .filter(l => l.startsWith(name + ":") || l.startsWith(name + ";"))
    .flatMap(l => l.substring(l.indexOf(":") + 1).split(","))
    .map(x => x.trim())
    .filter(Boolean);
}

function cleanIcsText(text) {
  return text
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\n/g, " ")
    .replace(/\\\\/g, "\\")
    .trim();
}

function parseIcsDate(value) {
  if (!value) return null;
  // DATE
  if (/^\d{8}$/.test(value)) {
    return new Date(Number(value.slice(0,4)), Number(value.slice(4,6))-1, Number(value.slice(6,8)), 0, 0, 0);
  }

  // DATE-TIME, with or without Z. TZID values are already removed by readIcsValue after colon.
  const m = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?/);
  if (!m) return null;

  if (value.endsWith("Z")) {
    return new Date(Date.UTC(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +(m[6] || 0)));
  }

  return new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +(m[6] || 0));
}

function makeEvent(title, start, raw) {
  const allDay = /^\d{8}$/.test(raw);
  return {
    title,
    start: new Date(start),
    allDay,
    time: allDay ? "" : start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
  };
}

function expandRecurring(events, title, start, rawStart, rrule, exDateKeys, windowStart, windowEnd) {
  const parts = Object.fromEntries(rrule.split(";").map(p => {
    const [k, v] = p.split("=");
    return [k, v];
  }));

  const freq = parts.FREQ;
  const interval = Number(parts.INTERVAL || 1);
  const until = parts.UNTIL ? parseIcsDate(parts.UNTIL) : windowEnd;
  const count = Number(parts.COUNT || 0);
  const byDays = parts.BYDAY ? parts.BYDAY.split(",").map(x => x.replace(/^-?\d+/, "")) : [];

  const weekdayMap = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  let addedTotal = 0;

  if (freq === "WEEKLY" && byDays.length) {
    let cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    cursor.setDate(cursor.getDate() - cursor.getDay()); // week start

    let guard = 0;
    while (cursor < windowEnd && guard < 240) {
      guard++;
      byDays.forEach(day => {
        const dayNum = weekdayMap[day];
        if (dayNum === undefined) return;

        const occurrence = new Date(cursor);
        occurrence.setDate(cursor.getDate() + dayNum);
        occurrence.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);

        if (occurrence < start) return;
        if (until && occurrence > until) return;
        if (occurrence >= windowStart && occurrence < windowEnd && !exDateKeys.includes(dateKey(occurrence))) {
          events.push(makeEvent(title, occurrence, rawStart));
          addedTotal++;
        }
      });

      if (count && addedTotal >= count) break;
      cursor.setDate(cursor.getDate() + 7 * interval);
    }
    return;
  }

  let current = new Date(start);
  let guard = 0;

  while (current < windowEnd && guard < 500) {
    guard++;

    if ((!until || current <= until) && current >= windowStart && !exDateKeys.includes(dateKey(current))) {
      events.push(makeEvent(title, current, rawStart));
      addedTotal++;
      if (count && addedTotal >= count) break;
    }

    if (freq === "DAILY") current.setDate(current.getDate() + interval);
    else if (freq === "WEEKLY") current.setDate(current.getDate() + 7 * interval);
    else if (freq === "MONTHLY") current.setMonth(current.getMonth() + interval);
    else if (freq === "YEARLY") current.setFullYear(current.getFullYear() + interval);
    else break;
  }
}


function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[s]));
}

document.querySelectorAll("[data-open]").forEach(card => {
  card.addEventListener("click", () => {
    const key = card.dataset.open;
    const url = data.links[key];
    if (url) window.location.href = url;
  });
});

document.querySelectorAll(".small-action").forEach(btn => {
  btn.addEventListener("click", event => {
    event.stopPropagation();
    editingKey = btn.dataset.edit;
    const titles = {
      today: "Edit Today",
      week: "Edit This Week",
      keepLists: "Edit Shared Lists",
      ring: "Edit Ring",
      smartthings: "Edit SmartThings",
      home: "Edit Google Home"
    };
    document.getElementById("editorTitle").textContent = titles[editingKey] || "Edit";
    document.getElementById("editorText").value = (data[editingKey] || []).join("\n");
    document.getElementById("editor").showModal();
  });
});

document.getElementById("saveEdit").addEventListener("click", event => {
  event.preventDefault();
  if (!editingKey) return;
  data[editingKey] = document.getElementById("editorText").value
    .split("\n")
    .map(x => x.trim())
    .filter(Boolean);
  saveData();
  render();
loadLiveCalendar();
setInterval(loadLiveCalendar, 1000 * 60 * 15);
  document.getElementById("editor").close();
});

document.getElementById("settingsBtn").addEventListener("click", () => {
  document.getElementById("linkCalendar").value = data.links.calendar || "";
  document.getElementById("calendarIcsUrl").value = data.calendarIcsUrl || "";
  document.getElementById("linkGrocery").value = data.links.keepGrocery || "";
  document.getElementById("linkRing").value = data.links.ring || "";
  document.getElementById("linkSmartthings").value = data.links.smartthings || "";
  document.getElementById("linkHome").value = data.links.home || "";
  document.getElementById("settings").showModal();
});

document.getElementById("saveSettings").addEventListener("click", event => {
  event.preventDefault();
  data.links.calendar = document.getElementById("linkCalendar").value.trim();
  data.calendarIcsUrl = document.getElementById("calendarIcsUrl").value.trim();
  data.links.keepGrocery = document.getElementById("linkGrocery").value.trim();
  data.links.ring = document.getElementById("linkRing").value.trim();
  data.links.smartthings = document.getElementById("linkSmartthings").value.trim();
  data.links.home = document.getElementById("linkHome").value.trim();
  saveData();
  document.getElementById("settings").close();
});

updateClock();
setInterval(updateClock, 1000 * 15);
render();
loadLiveCalendar();
setInterval(loadLiveCalendar, 1000 * 60 * 15);
