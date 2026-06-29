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
  ring: [
    "Alarm: Home",
    "Lock + Thermostat in Ring app",
    "Tap to open Ring"
  ],
  grocery: [
    "Milk",
    "Eggs",
    "Bread",
    "Fruit"
  ],
  todo: [
    "Return library books",
    "Schedule dentist",
    "Water plants"
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
  csv: {
    grocery: "",
    todo: ""
  },
  links: {
    calendar: "https://calendar.google.com/calendar/u/0/r",
    keepGrocery: "https://keep.google.com/",
    ring: "intent://#Intent;package=com.ringapp;scheme=ring;end",
    smartthings: "intent://#Intent;package=com.samsung.android.oneconnect;scheme=smartthings;end",
    home: "intent://#Intent;package=com.google.android.apps.chromecast.app;scheme=googlehome;end"
  }
};

const STORAGE_KEY = "hoganHomeHubV3";
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
  renderRing();
  renderKeepLists();
  renderSmartThings();
  renderHome();
}

function renderToday() {
  const list = document.getElementById("todayList");
  list.innerHTML = "";
  data.today.forEach(item => {
    const [time, ...rest] = item.split("|");
    const li = document.createElement("li");
    li.innerHTML = `<span class="when">${escapeHtml(time.trim())}</span><span>${escapeHtml(rest.join("|").trim() || time.trim())}</span>`;
    list.appendChild(li);
  });
}

function renderWeek() {
  const box = document.getElementById("weekList");
  box.innerHTML = "";
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  const eventsByDay = {};
  data.week.forEach(item => {
    const [day, ...rest] = item.split("|");
    const key = day.trim().slice(0,3).toLowerCase();
    eventsByDay[key] = eventsByDay[key] || [];
    eventsByDay[key].push(rest.join("|").trim() || item);
  });

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = dayNames[i].toLowerCase();
    const div = document.createElement("div");
    div.className = "day";
    const events = (eventsByDay[key] || []).slice(0, 3);
    div.innerHTML = `
      <div class="day-name">${dayNames[i]}</div>
      <div class="day-num">${d.getDate()}</div>
      ${events.map(e => `<div class="day-event">${escapeHtml(e)}</div>`).join("")}
    `;
    box.appendChild(div);
  }
}


function renderKeepLists() {
  const box = document.getElementById("keepListButtons");
  if (!box) return;
  box.innerHTML = "";
  const lists = data.keepLists || [];
  if (!lists.length) {
    box.innerHTML = `<div class="keep-list-empty">Tap Edit to add your Google Keep list titles and links.</div>`;
    return;
  }

  lists.slice(0, 8).forEach(item => {
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

function renderChecklist(id, items) {
  const list = document.getElementById(id);
  list.innerHTML = "";
  items.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="check"></span><span>${escapeHtml(item)}</span>`;
    list.appendChild(li);
  });
}

function renderRing() {
  const box = document.getElementById("ringContent");
  const [status = "Alarm: Home", devices = "Lock + Thermostat", note = "Tap to open Ring"] = data.ring || [];
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
  box.innerHTML = data.home.map(item => `<div class="home-chip">${escapeHtml(item)}</div>`).join("");
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

document.querySelectorAll(".edit-btn").forEach(btn => {
  btn.addEventListener("click", event => {
    event.stopPropagation();
    editingKey = btn.dataset.edit;
    const titles = {
      today: "Edit Today",
      week: "Edit This Week",
      ring: "Edit Ring Card",
      grocery: "Edit Grocery List",
      keepLists: "Edit Shared Lists",
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
  document.getElementById("editor").close();
});

document.getElementById("settingsBtn").addEventListener("click", () => {
  document.getElementById("linkCalendar").value = data.links.calendar || "";
  document.getElementById("linkGrocery").value = data.links.keepGrocery || "";

  document.getElementById("linkRing").value = data.links.ring || "";
  document.getElementById("linkSmartthings").value = data.links.smartthings || "";
  document.getElementById("linkHome").value = data.links.home || "";
  document.getElementById("settings").showModal();
});

document.getElementById("saveSettings").addEventListener("click", event => {
  event.preventDefault();
  data.links.calendar = document.getElementById("linkCalendar").value.trim();
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
