import {appointmentData} from './events.js';

// ########## VARIABLEN ##########

const historyCache = new Map();
const holidayCache = new Map();
const holidayPanelCache = new Map();
let renderedHolidayYear = null;
const schoolHolidayCache = new Map();
const OPEN_HOLIDAYS_BASE_URL = "https://openholidaysapi.org";
const COUNTRY_CODE = "DE";
const HESSEN_SUBDIVISION = "DE-HE";
const LANGUAGE_CODE = "DE";
const today = new Date();
export let viewYear = today.getFullYear();
export let viewMonth = today.getMonth();
export let selectedKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

// const monthNames = Array.from({length: 12}, (_, i) => {
//     return new Intl.DateTimeFormat('de-DE', {month: 'long'}).format(new Date(0, i));
// });

const monthNames = [
    "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"
]

// ########## /VARIABLEN ##########

// ########## FUNCTIONS ##########

// ======== HELP FUNCTIONS ========

// Tag 0 wird hier benutzt, das heißt dadurch, dass ich month + 1 habe, 
// beziehe ich mich auf den letzten Tag des aktuellen Monats, da der 
// Tag 0 vom Folgemonat der letzte Tag des aktuellen ist. Dadurch habe ich 
// die Anzahl der Tage im Monat.
export function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

// Diese Hilfsfunktion bewirkt, dass Sonntag nicht mehr der erste Tag der
// Woche ist, sondern der letzte. Montag wird zum ersten Tag.
export function getFirstWeekdayOfMonth(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1;
}

// Formatiert ins Deutsche Format.
export function formatGermanDate(year, monthIndex, day) {
    return `${pad2(day)}. ${monthNames[monthIndex]} ${year}`;
}

// Wandelt die einstelligen Tage in zweistellige mit einer 0 davor.
export function pad2(n) {
    return String(n).padStart(2, "0");
}

// toKey Funktion, um dem Key ein bestimmtes Format vorzugeben.
export function toKey(year, monthIndex, day) {
    return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

// Funktion für alle deutschen Tage in der Woche.
export function getGermanWeekdayName(year, monthIndex, day) {
  const names = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  return names[new Date(year, monthIndex, day).getDay()];
}

// Funktion zum Herausfinden der wie vielte selbe Tag des Monats es ist.
export function nthWeekdayInMonth(day) {
  return Math.floor((day - 1) / 7) + 1;
}

// Funktion zum Anzeigen des Textes wo drinsteht der wie vielte selbe Tag des
// Monats es ist.
export function buildDailyInfoText(key) {
  const [y, m, d] = key.split("-").map(Number);
  const monthIndex = m - 1;
  const dateWritten = formatGermanDate(y, monthIndex, d);
  const weekday = getGermanWeekdayName(y, monthIndex, d);
  const nth = nthWeekdayInMonth(d);
  const monthName = monthNames[monthIndex];

  const holidayText = "kein";

  return `Der ${dateWritten} ist ein ${weekday} und zwar der ${nth}. ${weekday} im Monat ${monthName} des Jahres ${y}. Heute ist ${holidayText} gesetzlicher Feiertag.`;
}

// Funktion, die den Histrische Ereignisse Bereich darstellt.
export function paintHistoryPanel(panel, events, infoText) {
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

export function getEventsForDay(dateKey) {
    return appointmentData.filter(event => event.datum === dateKey);
}

// Funktion zum Öfnnen des Modals
export function openEventModal() {
  const overlay = document.getElementById("event-modal-overlay");
  if (!overlay) return;

  overlay.classList.remove("hidden");

  // aktuelles Datum automatisch eintragen
  const dateInput = document.getElementById("event-date");
  if (dateInput && selectedKey) {
    dateInput.value = selectedKey;
  }
}

// Funktion zum Schließen des Modals
export function closeEventModal() {
  const overlay = document.getElementById("event-modal-overlay");
  if (!overlay) return;

  overlay.classList.add("hidden");
}

export function saveEvent() {

  const dateInput = document.getElementById("event-date");
  const titleInput = document.getElementById("event-title");
  const descInput = document.getElementById("event-description");

  if (!dateInput || !titleInput) return;

  const datum = dateInput.value;
  const titel = titleInput.value.trim();
  const beschreibung = descInput.value.trim();

  if (!datum || !titel) {
    alert("Bitte Datum und Titel angeben.");
    return;
  }

  const newEvent = {
    id: Date.now(),
    datum: datum,
    titel: titel,
    beschreibung: beschreibung
  };

  appointmentData.push(newEvent);

  closeEventModal();

  renderCalendar();
  renderDayDetails(datum);
}

function normalizeName(entry) {
  if (!Array.isArray(entry.name)) return "Unbenannt";

  const germanName = entry.name.find(n => n.language === "DE");
  return germanName?.text ?? entry.name[0]?.text ?? "Unbenannt";
}

function isDateWithinRange(dateKey, startDate, endDate) {
  return dateKey >= startDate && dateKey <= endDate;
}

function formatDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const fmt = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

// ======== /HELP FUNCTIONS ========

// ======== NAVIGATION FUNCTIONS ========

export function goToPreviousMonth() {
  viewMonth--;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear--;
  }
}

export function goToNextMonth() {
  viewMonth++;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear++;
  }
}

// ======== /NAVIGATION FUNCTIONS ========

// ======== MAIN FUNCTIONS ========

// In der Funktion createBaseStructure(selector); wird eine 
// HTML-Grundstruktur aufgebaut. In diesem Fall für ein Kalender.
// Es werden Buttons hinzugefügt und jeweils Klassen für sie.
// Bei der Initialisierung der Funktion muss man als Parameter
// einen selector, also in diesem Fall #calendar, angeben.
export function createBaseStructure(selector) {
  const root = document.querySelector(selector);

  const header = document.createElement("div");
  header.className = "calendar-header";

  const leftArrow = document.createElement("i");
  leftArrow.className = "fas fa-chevron-left nav-arrow";
  leftArrow.id = "prevMonth";

  const eventBtn = document.createElement("button");
  eventBtn.className = "add-event-btn";
  eventBtn.id = "add-event-btn";
  eventBtn.innerHTML = "Event hinzufügen";

  const monthDisplay = document.createElement("h3");
  monthDisplay.className = "selected-month";

  const rightArrow = document.createElement("i");
  rightArrow.className = "fas fa-chevron-right nav-arrow";
  rightArrow.id = "nextMonth";

  const holidayPanel = document.createElement("div");
  holidayPanel.className = "holiday-panel";
  holidayPanel.id = "holiday-panel";

  header.append(leftArrow, monthDisplay, rightArrow);
  root.appendChild(header);

  root.appendChild(eventBtn);

  const calendarGrid = document.createElement("div");
  calendarGrid.className = "calendar-grid";
  calendarGrid.id = "month-days";
  root.appendChild(calendarGrid);

  const infoPanel = document.createElement("div");
  infoPanel.className = "day-info";
  infoPanel.id = "day-details";
  root.appendChild(infoPanel);

  root.appendChild(holidayPanel);
}

// Bei der Funktion renderDayDetails(key); geht es darum die Event Informationen
// des Tages aufzuschreiben. Dazu wurde ein ternärer Operator benutzt, um zu
// entscheiden, ob etwas in die Event Box reingeschrieben wird oder nur 
// "Keine Events." stehen wird.
export function renderDayDetails(key) {
  const panel = document.getElementById("day-details");
  const [y, m, d] = key.split("-").map(Number);
  const monthIndex = m - 1;

  const events = getEventsForDay(key);

  panel.innerHTML = `
    <h3>${formatGermanDate(y, monthIndex, d)}</h3>
    ${events.length === 0
      ? `<p style="margin:0;opacity:.8;">Keine Events.</p>`
      : `<ul class="events-list">
          ${events.map(ev => `
            <li class="event-item">
              <span class="event-time">${ev.uhrzeit ?? ""}</span>
              <span class="event-title">${ev.titel}</span>
              ${ev.beschreibung ? `<span class="event-note">${ev.beschreibung}</span>` : ""}
            </li>
          `).join("")}
        </ul>`
    }
  `;
}


// Hier kommen die Ereignisse, die aus der API reinkommen
export function addHistoryPanel(selector) {
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

// Die komplette Logik hinter dem Historische Ereignisse Bereich.
export async function renderHistoryPanel(key) {
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
    paintHistoryPanel(panel, historyCache.get(cacheKey), infoText);
    return;
  }

  // Backend aufrufen (Express Proxy)
  const url = `https://api.wikimedia.org/feed/v1/wikipedia/de/onthisday/events/${mm}/${dd}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {// || !data.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    const events = Array.isArray(data.events) ? data.events : [];
    historyCache.set(cacheKey, events);

    paintHistoryPanel(panel, events, infoText);
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
export function renderCalendar() {
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
      if ((getEventsForDay(key).length ?? 0) > 0) dayBtn.classList.add("has-events");

      // Click => select + render right panel
      dayBtn.addEventListener("click", () => {
        selectedKey = key;
        renderCalendar();
        renderDayDetails(selectedKey);
        renderHistoryPanel(selectedKey);
      });
    }

    calendarGrid.appendChild(dayBtn);
  }
}

// API für Feiertage
export async function fetchPublicHolidaysForYear(year) {
  const cacheKey = `public-${year}`;
  if (holidayCache.has(cacheKey)) {
    return holidayCache.get(cacheKey);
  }

  const validFrom = `${year}-01-01`;
  const validTo = `${year}-12-31`;

  const url =
    `${OPEN_HOLIDAYS_BASE_URL}/PublicHolidays` +
    `?countryIsoCode=${COUNTRY_CODE}` +
    `&languageIsoCode=${LANGUAGE_CODE}` +
    `&validFrom=${validFrom}` +
    `&validTo=${validTo}`;

  const res = await fetch(url, {
    headers: {
      accept: "application/json"
    }
  });

  if (!res.ok) {
    throw new Error(`Feiertage konnten nicht geladen werden. HTTP ${res.status}`);
  }

  const data = await res.json();
  holidayCache.set(cacheKey, data);
  return data;
}

// API für Schulferien.
export async function fetchSchoolHolidaysForYear(year) {
  const cacheKey = `school-${year}-${HESSEN_SUBDIVISION}`;
  if (schoolHolidayCache.has(cacheKey)) {
    return schoolHolidayCache.get(cacheKey);
  }

  const validFrom = `${year}-01-01`;
  const validTo = `${year}-12-31`;

  const url =
    `${OPEN_HOLIDAYS_BASE_URL}/SchoolHolidays` +
    `?countryIsoCode=${COUNTRY_CODE}` +
    `&subdivisionCode=${HESSEN_SUBDIVISION}` +
    `&languageIsoCode=${LANGUAGE_CODE}` +
    `&validFrom=${validFrom}` +
    `&validTo=${validTo}`;

  const res = await fetch(url, {
    headers: {
      accept: "application/json"
    }
  });

  if (!res.ok) {
    throw new Error(`Schulferien konnten nicht geladen werden. HTTP ${res.status}`);
  }

  const data = await res.json();
  schoolHolidayCache.set(cacheKey, data);
  return data;
}

// Das Rendern der Oberfläche der Feiertage und Schulferien.
export async function renderHolidayPanel(year) {
  const panel = document.getElementById("holiday-panel");
  if (!panel) return;

  // Wenn dieses Jahr schon gerendert wurde, nichts neu machen
  if (renderedHolidayYear === year) {
    return;
  }

  panel.innerHTML = `
    <h3>Feiertage & Ferien ${year}</h3>
    <p class="muted" style="margin:0;">Lade Daten…</p>
  `;

  try {
    let dataForYear;

    if (holidayPanelCache.has(year)) {
      dataForYear = holidayPanelCache.get(year);
    } else {
      const [holidays, vacations] = await Promise.all([
        fetchPublicHolidaysForYear(year),
        fetchSchoolHolidaysForYear(year)
      ]);

      dataForYear = { holidays, vacations };
      holidayPanelCache.set(year, dataForYear);
    }

    const { holidays, vacations } = dataForYear;

    panel.innerHTML = `
      <h3>Feiertage & Ferien ${year}</h3>

      <div class="holiday-section">
        <h4>Gesetzliche Feiertage</h4>
        ${
          holidays.length === 0
            ? `<p class="muted" style="margin:0;">Keine Feiertage gefunden.</p>`
            : `
              <ul class="holiday-list">
                ${holidays.map(entry => `
                  <li class="holiday-item">
                    <strong>${normalizeName(entry)}</strong>
                    <span class="holiday-range">
                      ${formatDateRange(entry.startDate || entry.date, entry.endDate || entry.date)}
                    </span>
                  </li>
                `).join("")}
              </ul>
            `
        }
      </div>

      <div class="holiday-section">
        <h4>Schulferien in Hessen</h4>
        ${
          vacations.length === 0
            ? `<p class="muted" style="margin:0;">Keine Schulferien gefunden.</p>`
            : `
              <ul class="holiday-list">
                ${vacations.map(entry => `
                  <li class="holiday-item">
                    <strong>${normalizeName(entry)}</strong>
                    <span class="holiday-range">
                      ${formatDateRange(entry.startDate, entry.endDate)}
                    </span>
                  </li>
                `).join("")}
              </ul>
            `
        }
      </div>
    `;

    renderedHolidayYear = year;
  } catch (err) {
    panel.innerHTML = `
      <h3>Feiertage & Ferien ${year}</h3>
      <p class="muted" style="margin:0;">Fehler beim Laden: ${String(err)}</p>
    `;
  }
}

// Erstellen meines Modal Fensters
export function createEventModal() {
  const existingModal = document.getElementById("event-modal-overlay");
  if (existingModal) return;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay hidden";
  overlay.id = "event-modal-overlay";

  overlay.innerHTML = `
    <div class="event-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="event-modal-header">
        <h3 id="event-modal-title">Neues Event hinzufügen</h3>
      </div>

      <div class="event-modal-body">
        <label class="modal-label" for="event-date">Datum</label>
        <div class="date-input-row">
          <input type="date" id="event-date" class="modal-input">
          <button type="button" id="use-selected-date-btn" class="modal-secondary-btn">
            Gewählten Tag übernehmen
          </button>
        </div>

        <label class="modal-label" for="event-title">Event</label>
        <input
          type="text"
          id="event-title"
          class="modal-input"
          placeholder="z. B. Zahnarzttermin"
        >

        <label class="modal-label" for="event-description">Beschreibung</label>
        <textarea
          id="event-description"
          class="modal-textarea"
          placeholder="Optionale Beschreibung..."
          rows="5"
        ></textarea>
      </div>

      <div class="event-modal-footer">
        <button type="button" id="save-event-btn" class="modal-primary-btn">Speichern</button>
        <button type="button" id="cancel-event-btn" class="modal-secondary-btn">Abbrechen</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}

// ======== /MAIN FUNCTIONS ========

// ########## /FUNCTIONS ##########