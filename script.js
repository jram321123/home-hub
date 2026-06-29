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
    url.searchParams.set("showDate", "0");
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
  const pkg = data.packages?.[appKey];
  const method = getLaunchMethod(appKey);

  // Known good routes are kept separate so one app cannot break the others.
  // SmartThings and Google Home use the browser intent route that worked earlier.
  // Ring is isolated and tries Ring-specific options before the generic package launch.
  const launchers = {
    ring: [
      "intent://ring.com/dashboard#Intent;scheme=https;package=com.ringapp;end",
      "intent://#Intent;package=com.ringapp;end",
      "ring://"
    ],
    smartthings: [
      "intent://#Intent;package=com.samsung.android.oneconnect;scheme=smartthings;end",
      "intent://#Intent;package=com.samsung.android.oneconnect;end"
    ],
    googlehome: [
      "intent://#Intent;package=com.google.android.apps.chromecast.app;scheme=googlehome;end",
      "intent://#Intent;package=com.google.android.apps.chromecast.app;end"
    ],
    calendar: [
      "intent://#Intent;package=com.google.android.calendar;end",
      data.fallbacks?.calendar || data.links?.calendarWeb || "https://calendar.google.com/calendar/u/0/r"
    ],
    keep: [
      "intent://#Intent;package=com.google.android.keep;end",
      data.fallbacks?.keep || data.links?.keepWeb || "https://keep.google.com/"
    ]
  };

  logLaunch(appKey, method, pkg);

  if (method === "androidInterface" && window.Android && typeof Android.openApplication === "function" && pkg) {
    try { Android.openApplication(pkg); return; } catch (e) { console.log(e); }
  }

  if (method === "fullyInterface" && window.fully && typeof fully.startApplication === "function" && pkg) {
    try { fully.startApplication(pkg); return; } catch (e) { console.log(e); }
  }

  const urls = launchers[appKey] || (pkg ? [`intent://#Intent;package=${pkg};end`] : []);
  if (!urls.length) return;

  // Use the first URL only. Multiple automatic attempts often cause web fallbacks.
  window.location.href = urls[0];
}

function getLaunchMethod(appKey) {
  if (window.Android && typeof Android.openApplication === "function") return "androidInterface";
  if (window.fully && typeof fully.startApplication === "function") return "fullyInterface";
  return "intent";
}

function logLaunch(appKey, method, pkg) {
  try {
    const logs = JSON.parse(localStorage.getItem("homeHubLaunchLogs") || "[]");
    logs.unshift({
      time: new Date().toLocaleTimeString(),
      appKey,
      method,
      pkg,
      hasAndroid: !!window.Android,
      hasFully: !!window.fully
    });
    localStorage.setItem("homeHubLaunchLogs", JSON.stringify(logs.slice(0, 12)));
  } catch {}
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


const debugButton = document.getElementById("showDebug");
if (debugButton) {
  debugButton.addEventListener("click", () => {
    const logs = JSON.parse(localStorage.getItem("homeHubLaunchLogs") || "[]");
    const info = {
      userAgent: navigator.userAgent,
      hasAndroidInterface: !!window.Android,
      hasAndroidOpenApplication: !!(window.Android && typeof Android.openApplication === "function"),
      hasFullyInterface: !!window.fully,
      hasFullyStartApplication: !!(window.fully && typeof fully.startApplication === "function"),
      launchMethodNow: {
        ring: getLaunchMethod("ring"),
        smartthings: getLaunchMethod("smartthings"),
        googlehome: getLaunchMethod("googlehome")
      },
      packages: data.packages,
      recentLaunches: logs
    };
    document.getElementById("debugText").textContent = JSON.stringify(info, null, 2);
    document.getElementById("debugModal").showModal();
  });
}

updateClock();
setInterval(updateClock, 1000 * 15);
render();
