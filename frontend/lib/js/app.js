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

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-first (Mo=0 ... So=6)
function getFirstWeekdayOfMonth(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // So=0..Sa=6
  return firstDay === 0 ? 6 : firstDay - 1;
}

// ===== Helpers =====
function pad2(n) {
  return String(n).padStart(2, "0");
}

function toKey(year, monthIndex, day) {
  // monthIndex: 0-11
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function formatGermanDate(year, monthIndex, day) {
  return `${day}. ${monthNames[monthIndex]} ${year}`;
}

// ===== State =====
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();
let selectedKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

// ===== Right Panel Rendering =====
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
renderCalendar();
renderDayDetails(selectedKey);

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