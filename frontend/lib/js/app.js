const today = new Date();
const calendarStartYear = 2020;
const calendarEndYear = 2030;

const monthNames = [
  "Januar","Februar","März","April","Mai","Juni",
  "Juli","August","September","Oktober","November","Dezember"
];

// ===== EVENTS (Beispiele) =====
const eventsByDate = {
  // Beispiel: heutiger Tag
  [toKey(today.getFullYear(), today.getMonth(), today.getDate())]: [
    { time: "5:40", title: "Aufgestanden", note: "15 min" },
    { time: "6:45", title: "Umschulung angefangen", note: "Javascript einbinden" }
  ],

  // Beispiel: fester Tag
  "2026-02-14": [
    { time: "19:00", title: "Zuhause bleiben, was sonst xD", note: "Alleine Zuhause" }
  ]
};

// In der Funktion createBaseStructure(selector); wird eine 
// HTML-Grundstruktur aufgebaut. In diesem Fall für ein Kalender.
// Es werden Buttons hinzugefügt und jeweils Klassen für sie.
// Bei der Initialisierung der Funktion muss man als Parameter
// einen selector, also in diesem Fall #calendar, angeben.
function createBaseStructure(selector) {
  const root = document.querySelector(selector);

  const header = document.createElement("div");
  header.className = "calendar-header";

  const leftArrow = document.createElement("i");
  leftArrow.className = "fas fa-chevron-left nav-arrow";
  leftArrow.id = "prevMonth";

  const monthDisplay = document.createElement("h3");
  monthDisplay.className = "selected-month";

  const rightArrow = document.createElement("i");
  rightArrow.className = "fas fa-chevron-right nav-arrow";
  rightArrow.id = "nextMonth";

  header.append(leftArrow, monthDisplay, rightArrow);
  root.appendChild(header);

  const calendarGrid = document.createElement("div");
  calendarGrid.className = "calendar-grid";
  calendarGrid.id = "month-days";
  root.appendChild(calendarGrid);

  const infoPanel = document.createElement("div");
  infoPanel.className = "day-info";
  infoPanel.id = "day-details";
  root.appendChild(infoPanel);
}

// Gibt Jahr, Monat + 1 (also fängt nicht mehr bei 0, sondern bei 1 an),
// Tag an. In diesem wird 0 benutzt, da 0 der letzte Tag des Monats ist.
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-first (Mo=0 ... So=6)
function getFirstWeekdayOfMonth(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // So=0..Sa=6
  return firstDay === 0 ? 6 : firstDay - 1;
}

// ===== Helpers =====

// Durch die Funktion pad2(n); wird die Datumszahl um 0 davor ergänzt,
// falls es nur einstellig ist.
function pad2(n) {
  return String(n).padStart(2, "0");
}

// Die Funktion toKey(year, monthIndex, day); formatiert das Datum.
function toKey(year, monthIndex, day) {
  // monthIndex: 0-11
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

// Die Funktion formatGermanDate(year, monthIndex, day); formatiert
// das Datum vom Englischen in das Deutsche.
function formatGermanDate(year, monthIndex, day) {
  return `${day}. ${monthNames[monthIndex]} ${year}`;
}

// ===== State =====
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selectedKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

// ===== Right Panel Rendering =====

// Bei der Funktion renderDayDetails(key); geht es darum die Event Informationen
// des Tages aufzuschreiben. Dazu wurde ein ternärer Operator benutzt.

function renderDayDetails(key) {
  const panel = document.getElementById("day-details");
  const [y, m, d] = key.split("-").map(Number);
  const monthIndex = m - 1;

  const events = eventsByDate[key] ?? [];

  panel.innerHTML = `
    <h3>${formatGermanDate(y, monthIndex, d)}</h3>
    ${events.length === 0
      ? `<p style="margin:0;opacity:.8;">Keine Events.</p>`
      : `<ul class="events-list">
          ${events.map(ev => `
            <li class="event-item">
              <span class="event-time">${ev.time ?? ""}</span>
              <span class="event-title">${ev.title}</span>
              ${ev.note ? `<span class="event-note">${ev.note}</span>` : ""}
            </li>
          `).join("")}
        </ul>`
    }
  `;
}

// Hier kommen die Ereignisse, die aus der API reinkommen
function addHistoryPanel(selector) {
  const root = document.querySelector(selector);
  const historyPanel = document.createElement("div");
  historyPanel.className = "history-panel";
  historyPanel.id = "history-panel";

  historyPanel.innerHTML = `
    <h3 style="margin: 0 0 8px 0;">Historische Ereignisse</h3>
    <p style="margin: 0; opacity: 0.85;">(Hier kommt später die API-Ausgabe rein)</p>
  `;

  root.appendChild(historyPanel);
}

// Die History durch API + tägliche Info
const historyCache = new Map();

function getGermanWeekdayName(year, monthIndex, day) {
  const names = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  return names[new Date(year, monthIndex, day).getDay()];
}

function nthWeekdayInMonth(day) {
  return Math.floor((day - 1) / 7) + 1;
}

function buildDailyInfoText(key) {
  const [y, m, d] = key.split("-").map(Number);
  const monthIndex = m - 1;
  const dateWritten = formatGermanDate(y, monthIndex, d);
  const weekday = getGermanWeekdayName(y, monthIndex, d);
  const nth = nthWeekdayInMonth(d);
  const monthName = monthNames[monthIndex];

  const holidayText = "kein";

  return `Der ${dateWritten} ist ein ${weekday} und zwar der ${nth}. ${weekday} im Monat ${monthName} des Jahres ${y}. Heute ist ${holidayText} gesetzlicher Feiertag.`;
}

function addHistoryPanel(panel, events, infoText) {
  const safeEvents = (events ?? []).slice(0, 5);

  panel.innerHTML = `
    <div class="history-split">
      <div class="history-left">
        <h3 style="margin:0 0 8px 0;">Historische Ereignisse</h3>
        ${
          safeEvents.length === 0
            ? `<p class="muted" style="margin:0;">Keine historischen Ereignisse gefunden.</p>`
            : `<ul class="history-list">
                ${safeEvents.map(ev => `
                  <li class="history-item">
                    <span class="history-year">${ev.year ?? ""}</span>
                    <span class="muted">${ev.text ?? ""}</span>
                  </li>
                `).join("")}
              </ul>`
        }
      </div>

      <div class="history-right">
        <h3 style="margin:0 0 8px 0;">Heutige Information</h3>
        <p class="muted" style="margin:0;">${infoText}</p>
      </div>
    </div>
  `;
}

async function renderHistoryPanel(key) {
  const panel = document.getElementById("history-panel");
  if (!panel) return;

  const [y, m, d] = key.split("-").map(Number);
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  const cacheKey = `${mm}-${dd}`;

  const infoText = buildDailyInfoText(key);

  panel.innerHTML = `
    <div class="history-split">
      <div class="history-left">
        <h3 style="margin:0 0 8px 0;">Historische Ereignisse</h3>
        <p class="muted" style="margin:0;">Lade historische Ereignisse…</p>
      </div>
      <div class="history-right">
        <h3 style="margin:0 0 8px 0;">Heutige Information</h3>
        <p class="muted" style="margin:0;">${infoText}</p>
      </div>
    </div>
  `;

  // Frontend-Cache nutzen
  if (historyCache.has(cacheKey)) {
    addHistoryPanel(panel, historyCache.get(cacheKey), infoText);
    return;
  }

  // Backend aufrufen (Express Proxy)
  const url = `http://localhost:3001/api/history?mm=${mm}&dd=${dd}&lang=de`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    const events = Array.isArray(data.events) ? data.events : [];
    historyCache.set(cacheKey, events);

    addHistoryPanel(panel, events, infoText);
  } catch (err) {
    panel.innerHTML = `
      <div class="history-split">
        <div class="history-left">
          <h3 style="margin:0 0 8px 0;">Historische Ereignisse</h3>
          <p class="muted" style="margin:0;">Fehler beim Laden: ${String(err)}</p>
        </div>
        <div class="history-right">
          <h3 style="margin:0 0 8px 0;">Heutige Information</h3>
          <p class="muted" style="margin:0;">${infoText}</p>
        </div>
      </div>
    `;
  }
}

// ===== Calendar Rendering =====
function renderCalendar() {
  const monthDisplay = document.querySelector(".selected-month");
  monthDisplay.textContent = `${monthNames[viewMonth]} ${viewYear}`;

  const calendarGrid = document.getElementById("month-days");
  calendarGrid.innerHTML = "";

  const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  weekdays.forEach(d => {
    const el = document.createElement("div");
    el.className = "weekday";
    el.textContent = d;
    calendarGrid.appendChild(el);
  });

  const numDays = daysInMonth(viewYear, viewMonth);
  const firstWeekday = getFirstWeekdayOfMonth(viewYear, viewMonth);

  const totalCells = 42;
  for (let cell = 0; cell < totalCells; cell++) {
    const dayBtn = document.createElement("button");
    dayBtn.className = "day-btn";

    const dayNumber = cell - firstWeekday + 1;

    if (dayNumber < 1 || dayNumber > numDays) {
      dayBtn.classList.add("empty");
      dayBtn.disabled = true;
      dayBtn.textContent = "";
    } else {
      dayBtn.textContent = dayNumber;

      const key = toKey(viewYear, viewMonth, dayNumber);

      // Today highlight
      const isToday =
        dayNumber === today.getDate() &&
        viewMonth === today.getMonth() &&
        viewYear === today.getFullYear();
      if (isToday) dayBtn.classList.add("today");

      // Selected highlight
      if (key === selectedKey) dayBtn.classList.add("selected");

      // Has events indicator
      if ((eventsByDate[key]?.length ?? 0) > 0) dayBtn.classList.add("has-events");

      // Click => select + render right panel
      dayBtn.addEventListener("click", () => {
        selectedKey = key;
        renderCalendar();
        renderDayDetails(selectedKey);
      });
    }

    calendarGrid.appendChild(dayBtn);
  }
}

// ===== Init =====
createBaseStructure("#calendar");
addHistoryPanel("#calendar");
renderCalendar();
renderDayDetails(selectedKey);
renderHistoryPanel(selectedKey);

// Nav
document.getElementById("prevMonth").addEventListener("click", () => {
  viewMonth--;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear--;
  }
  renderCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  viewMonth++;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear++;
  }
  renderCalendar();
});