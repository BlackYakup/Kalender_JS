const calendarEl = document.getElementById("calendar");
const monthLabelEl = document.getElementById("monthLabel");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

const panelTitleEl = document.getElementById("panelTitle");
const panelDateEl = document.getElementById("panelDate");
const panelContentEl = document.getElementById("panelContent");

// Beispiel: Was an bestimmten Tagen geschah (Demo)
// Key = "YYYY-MM-DD"
const dayHistory = {
  "2026-02-23": [
    "Projekt gestartet: Kalender-UI gebaut",
    "Bugfix: getDay statt getDate",
  ],
  "2026-02-01": [
    "Neuer Monat – Planung begonnen"
  ]
};

if (!calendarEl || !monthLabelEl || !prevBtn || !nextBtn) {
  throw new Error("Fehlende Elemente: Prüfe deine HTML-IDs (calendar, monthLabel, prevMonth, nextMonth).");
}

const monthNames = [
  "Januar","Februar","März","April","Mai","Juni",
  "Juli","August","September","Oktober","November","Dezember"
];

const weekdayNames = ["Mo","Di","Mi","Do","Fr","Sa","So"];

// ===== Helpers =====
function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function firstWeekdayIndex_MondayFirst(year, monthIndex) {
  const jsDay = new Date(year, monthIndex, 1).getDay(); // 0=So..6=Sa
  return (jsDay + 6) % 7; // Mo-first
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ===== State: aktueller Monat =====
let viewDate = new Date(); // startet im aktuellen Monat (heute)
let viewYear = viewDate.getFullYear();
let viewMonth = viewDate.getMonth(); // 0-11

function renderMonth(year, monthIndex) {
  calendarEl.innerHTML = "";

  // Label oben
  monthLabelEl.textContent = `${monthNames[monthIndex]} ${year}`;

  // Container im gleichen Stil wie vorher (optional)
  const monthDiv = document.createElement("div");
  monthDiv.className = "month";

  const monthTitle = document.createElement("h3");
  monthTitle.textContent = monthNames[monthIndex];
  monthDiv.appendChild(monthTitle);

  // Wochentage
  const weekdaysRow = document.createElement("div");
  weekdaysRow.className = "weekdays";
  weekdayNames.forEach(w => {
    const wd = document.createElement("div");
    wd.textContent = w;
    weekdaysRow.appendChild(wd);
  });
  monthDiv.appendChild(weekdaysRow);

  // Tage Grid
  const daysGrid = document.createElement("div");
  daysGrid.className = "days";

  const firstIndex = firstWeekdayIndex_MondayFirst(year, monthIndex);
  const totalDays = daysInMonth(year, monthIndex);

  // leere Felder
  for (let i = 0; i < firstIndex; i++) {
    const empty = document.createElement("div");
    empty.className = "empty";
    daysGrid.appendChild(empty);
  }

  const today = new Date();

  // Buttons
  for (let day = 1; day <= totalDays; day++) {
    const btn = document.createElement("button");
    btn.className = "day-btn";
    btn.type = "button";
    btn.textContent = day;

    const dateObj = new Date(year, monthIndex, day);
    btn.dataset.date = dateObj.toISOString().slice(0, 10);

    // Heute markieren
    if (isSameDate(dateObj, today)) {
      btn.classList.add("today");
    }

    btn.addEventListener("click", () => {
        renderDayPanel(dateObj);
    });

    daysGrid.appendChild(btn);
  }

  monthDiv.appendChild(daysGrid);
  calendarEl.appendChild(monthDiv);
}

// ===== Navigation =====
function goToPrevMonth() {
  viewMonth--;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear--;
  }
  renderMonth(viewYear, viewMonth);
}

function goToNextMonth() {
  viewMonth++;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear++;
  }
  renderMonth(viewYear, viewMonth);
}

prevBtn.addEventListener("click", goToPrevMonth);
nextBtn.addEventListener("click", goToNextMonth);

// Initial render
renderMonth(viewYear, viewMonth);