const DEFAULT_DATA = {
  calendarEmbedUrl: "",
  keepLists: [
    "🛒 | Grocery List | https://keep.google.com/",
    "✅ | Family To-Do | https://keep.google.com/",
    "🌱 | Garden | https://keep.google.com/",
    "🏡 | Home Projects | https://keep.google.com/",
    "🚗 | Vehicle Maintenance | https://keep.google.com/",
    "👧 | Kids | https://keep.google.com/"
  ],
  links: {
    calendarWeb: "https://calendar.google.com/calendar/u/0/r",
    keepWeb: "https://keep.google.com/"
  },
  packages: {
    ring: "com.ringapp",
    smartthings: "com.samsung.android.oneconnect",
    googlehome: "com.google.android.apps.chromecast.app",
    calendar: "com.google.android.calendar",
    keep: "com.google.android.keep"
  },
  fallbacks: {
    ring: "https://ring.com/account/dashboard",
    smartthings: "https://my.smartthings.com/",
    googlehome: "https://home.google.com/",
    calendar: "https://calendar.google.com/calendar/u/0/r",
    keep: "https://keep.google.com/"
  }
};

const STORAGE_KEY = "hoganHomeHubV40";
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
  renderGoogleCalendarEmbed();
  renderKeepLists();
}

function renderGoogleCalendarEmbed() {
  const weekBox = document.getElementById("calendarEmbedContainer");
  const todayBox = document.getElementById("todayEmbedContainer");

  if (!data.calendarEmbedUrl) {
    weekBox.innerHTML = `<div class="calendar-connect-message">Tap ⚙ and paste your Google Calendar embed URL/code to show your real calendar here.</div>`;
    todayBox.innerHTML = `<div class="calendar-connect-message">Today agenda appears after the calendar is connected.</div>`;
    return;
  }

  const weekUrl = buildCalendarEmbedUrl(data.calendarEmbedUrl, "WEEK");
  const agendaUrl = buildCalendarEmbedUrl(data.calendarEmbedUrl, "AGENDA");

  weekBox.innerHTML = `<iframe class="gcal-frame" src="${escapeHtml(weekUrl)}"></iframe>`;
  todayBox.innerHTML = `<iframe class="gcal-frame" src="${escapeHtml(agendaUrl)}"></iframe>`;
}

function buildCalendarEmbedUrl(raw, mode) {
  try {
    const srcMatch = raw.match(/src=["']([^"']+)["']/i);
    const urlString = srcMatch ? srcMatch[1] : raw;
    const url = new URL(urlString.replace(/&amp;/g, "&"));
    url.searchParams.set("mode", mode);
    url.searchParams.set("showTitle", "0");
    url.searchParams.set("showNav", "0");
    url.searchParams.set("showPrint", "0");
    url.searchParams.set("showTabs", "0");
    url.searchParams.set("showCalendars", "0");
    url.searchParams.set("showTz", "0");
    url.searchParams.set("wkst", "1");
    url.searchParams.set("bgcolor", "#111111");
    return url.toString();
  } catch {
    return raw;
  }
}

function renderKeepLists() {
  const box = document.getElementById("keepListButtons");
  box.innerHTML = "";

  (data.keepLists || []).slice(0, 9).forEach(item => {
    const [icon = "📝", title = "Keep List", url = data.links.keepWeb || "https://keep.google.com/"] =
      item.split("|").map(x => x.trim());
    const a = document.createElement("a");
    a.className = "keep-list-button";
    a.href = url || data.links.keepWeb || "https://keep.google.com/";
    a.innerHTML = `
      <span class="keep-list-icon">${escapeHtml(icon)}</span>
      <span class="keep-list-title">${escapeHtml(title)}</span>
    `;
    a.addEventListener("click", event => {
      event.stopPropagation();
      // Keep note links should open directly when provided; default opens Keep app if available.
      if (!url || url === "https://keep.google.com/") {
        event.preventDefault();
        openApp("keep");
      }
    });
    box.appendChild(a);
  });
}

function openApp(appKey) {
  const pkg = data.packages[appKey];
  const fallback = data.fallbacks[appKey];

  // Fully Kiosk JavaScript interface. This is the most reliable method inside Fully.
  try {
    if (window.fully && pkg && typeof fully.startApplication === "function") {
      fully.startApplication(pkg);
      return;
    }
  } catch (e) {}

  // Some Fully versions expose the Android interface differently.
  try {
    if (window.fully && pkg && typeof fully.startApplicationByPackageName === "function") {
      fully.startApplicationByPackageName(pkg);
      return;
    }
  } catch (e) {}

  // Android intent fallback.
  if (pkg) {
    try {
      window.location.href = `intent://#Intent;package=${pkg};end`;
      setTimeout(() => {
        if (fallback) window.location.href = fallback;
      }, 700);
      return;
    } catch (e) {}
  }

  if (fallback) window.location.href = fallback;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[s]));
}

// Card and button app launching
document.querySelectorAll("[data-app]").forEach(el => {
  el.addEventListener("click", event => {
    event.stopPropagation();
    openApp(el.dataset.app);
  });
});

// Shared list editor
document.querySelectorAll("[data-edit]").forEach(btn => {
  btn.addEventListener("click", event => {
    event.stopPropagation();
    editingKey = btn.dataset.edit;
    document.getElementById("editorTitle").textContent = "Edit Shared Lists";
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
  document.getElementById("calendarEmbedUrl").value = data.calendarEmbedUrl || "";
  document.getElementById("calendarWebUrl").value = data.links.calendarWeb || "";
  document.getElementById("keepWebUrl").value = data.links.keepWeb || "";
  document.getElementById("settings").showModal();
});

document.getElementById("saveSettings").addEventListener("click", event => {
  event.preventDefault();
  data.calendarEmbedUrl = document.getElementById("calendarEmbedUrl").value.trim();
  data.links.calendarWeb = document.getElementById("calendarWebUrl").value.trim();
  data.fallbacks.calendar = data.links.calendarWeb;
  data.links.keepWeb = document.getElementById("keepWebUrl").value.trim();
  data.fallbacks.keep = data.links.keepWeb;
  saveData();
  render();
  document.getElementById("settings").close();
});

updateClock();
setInterval(updateClock, 1000 * 15);
render();
