import {
  createBaseStructure,
  createEventModal,
  addHistoryPanel,
  renderCalendar,
  renderDayDetails,
  renderHistoryPanel,
  renderHolidayPanel,
  selectedKey,
  viewYear,
  goToPreviousMonth,
  goToNextMonth,
  openEventModal,
  closeEventModal,
  saveEvent
} from './domHelpers.js';

// ===== Init =====
createBaseStructure("#calendar");
createEventModal();
addHistoryPanel("#calendar");
renderCalendar();
renderDayDetails(selectedKey);
renderHistoryPanel(selectedKey);
renderHolidayPanel(viewYear);

// Nav
document.getElementById("prevMonth").addEventListener("click", () => {
  goToPreviousMonth();
  renderCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  goToNextMonth();
  renderCalendar();
});

document.getElementById("add-event-btn").addEventListener("click", () => {
  openEventModal();
})

document.getElementById("cancel-event-btn").addEventListener("click", () => {
  closeEventModal();
})

document.getElementById("save-event-btn").addEventListener("click", () => {
  saveEvent();
})