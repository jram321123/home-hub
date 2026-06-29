const DEFAULT_DATA = {
  today: [
    "8:00 AM | Kids morning routine",
    "12:00 PM | Lunch / reset",
    "6:00 PM | Family dinner"
  ],
  weather: [
    "78° Mostly clear",
    "High 82° / Low 64°",
    "Rain chance 20%"
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
  todo: [
    "Return library books",
    "Schedule dentist",
    "Water plants"
  ],
  grocery: [
    "Milk",
    "Eggs",
    "Bread",
    "Fruit"
  ],
  home: [
    "Lights",
    "Camera",
    "Garage",
    "Thermostat"
  ],
  links: {
    calendar: "https://calendar.google.com/calendar/u/0/r",
    keepGrocery: "https://keep.google.com/",
    keepTodo: "https://keep.google.com/",
    weather: "https://www.google.com/search?q=weather+Plain+City+Ohio",
    home: "https://home.google.com/"
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
  renderWeather();
  renderWeek();
  renderChecklist("todoList", data.todo);
  renderChecklist("groceryList", data.grocery);
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

function renderWeather() {
  const box = document.getElementById("weatherContent");
  const [main = "Weather", ...rest] = data.weather;
  box.innerHTML = `<div class="weather-main">${escapeHtml(main)}</div>` + 
    rest.map(x => `<div class="weather-detail">${escapeHtml(x)}</div>`).join("");
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

function renderChecklist(id, items) {
  const list = document.getElementById(id);
  list.innerHTML = "";
  items.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="check"></span><span>${escapeHtml(item)}</span>`;
    list.appendChild(li);
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
      weather: "Edit Weather",
      week: "Edit This Week",
      todo: "Edit Family To-Do",
      grocery: "Edit Grocery List",
      home: "Edit Home Controls"
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
  document.getElementById("linkTodo").value = data.links.keepTodo || "";
  document.getElementById("linkWeather").value = data.links.weather || "";
  document.getElementById("linkHome").value = data.links.home || "";
  document.getElementById("settings").showModal();
});

document.getElementById("saveSettings").addEventListener("click", event => {
  event.preventDefault();
  data.links.calendar = document.getElementById("linkCalendar").value.trim();
  data.links.keepGrocery = document.getElementById("linkGrocery").value.trim();
  data.links.keepTodo = document.getElementById("linkTodo").value.trim();
  data.links.weather = document.getElementById("linkWeather").value.trim();
  data.links.home = document.getElementById("linkHome").value.trim();
  saveData();
  document.getElementById("settings").close();
});

updateClock();
setInterval(updateClock, 1000 * 15);
render();
