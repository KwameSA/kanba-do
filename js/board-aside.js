import { readTasksFromStorage } from "./task-model.js";
import { buildFocusList, countTasksDueOnDate, toDateKey } from "./metrics.js";
import { openTaskEditorById } from "./tasks.js";
import { setDateFilter, getActiveDateFilter } from "./board-events.js";

let calendarMonth = new Date();
let selectedCalendarDate = null;

function formatDayLabel(date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
}

function formatShortDate(date) {
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  return `${mm}/${dd}`;
}

function isSameMonth(date, monthDate) {
  return date.getMonth() === monthDate.getMonth() && date.getFullYear() === monthDate.getFullYear();
}

function renderFocus(tasks) {
  const list = document.getElementById("focus-list");
  if (!list) return;
  const focus = buildFocusList(tasks, new Date());
  if (!focus.length) {
    list.innerHTML = `<li class="focus-empty">No active tasks right now.</li>`;
    return;
  }

  list.innerHTML = focus
    .map(
      ({ task, reasons }) => `
      <li class="focus-item" data-task-id="${task.id}">
        <button class="focus-open" type="button">
          <span class="focus-title">${task.text}</span>
          <span class="focus-reasons">${reasons.map((reason) => `<span class="focus-reason">${reason}</span>`).join("")}</span>
        </button>
      </li>
    `
    )
    .join("");

  list.querySelectorAll(".focus-item").forEach((item) => {
    item.addEventListener("click", () => {
      openTaskEditorById(item.dataset.taskId);
    });
  });
}

function renderDueStrip(tasks) {
  const strip = document.getElementById("due-strip");
  if (!strip) return;
  const activeDate = getActiveDateFilter();
  const today = new Date();
  const activeTasks = tasks.filter((task) => task.status !== "done");

  strip.innerHTML = "";
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);
    const dateKey = toDateKey(date);
    const totalCount = countTasksDueOnDate(activeTasks, dateKey, false);
    const doneCount = countTasksDueOnDate(tasks.filter((task) => task.status === "done"), dateKey, true);

    const button = document.createElement("button");
    button.type = "button";
    button.className = `strip-day${activeDate === dateKey ? " active" : ""}`;
    button.dataset.date = dateKey;
    button.innerHTML = `
      <span class="strip-day-name">${formatDayLabel(date)}</span>
      <span class="strip-day-date">${formatShortDate(date)}</span>
      <span class="strip-day-count">${totalCount}</span>
      ${doneCount ? `<span class="strip-day-done">DONE ${doneCount}</span>` : ""}
    `;
    button.addEventListener("click", () => setDateFilter(dateKey));
    strip.appendChild(button);
  }
}

function renderCalendarTasks(tasks) {
  const selectedList = document.getElementById("calendar-task-list");
  if (!selectedList) return;
  if (!selectedCalendarDate) {
    selectedList.innerHTML = `<p class="calendar-empty">Select a date to view tasks.</p>`;
    return;
  }
  const filtered = tasks.filter((task) => task.duedate === selectedCalendarDate);
  if (!filtered.length) {
    selectedList.innerHTML = `<p class="calendar-empty">No tasks due on this date.</p>`;
    return;
  }
  selectedList.innerHTML = filtered
    .map((task) => `<button type="button" class="calendar-task-item" data-task-id="${task.id}">${task.text}</button>`)
    .join("");
  selectedList.querySelectorAll(".calendar-task-item").forEach((item) => {
    item.addEventListener("click", () => openTaskEditorById(item.dataset.taskId));
  });
}

function renderCalendar(tasks) {
  const grid = document.getElementById("calendar-grid");
  const title = document.getElementById("calendar-month-label");
  if (!grid || !title) return;
  selectedCalendarDate = getActiveDateFilter() || selectedCalendarDate;

  title.textContent = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(calendarMonth);
  grid.innerHTML = "";

  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  const startWeekday = monthStart.getDay();
  const visibleStart = new Date(monthStart);
  visibleStart.setDate(monthStart.getDate() - startWeekday);

  for (let i = 0; i < 42; i++) {
    const date = new Date(visibleStart);
    date.setDate(visibleStart.getDate() + i);
    const dateKey = toDateKey(date);
    const count = countTasksDueOnDate(tasks, dateKey, true);

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-cell";
    if (!isSameMonth(date, calendarMonth)) cell.classList.add("outside");
    if (dateKey === selectedCalendarDate) cell.classList.add("selected");
    if (dateKey === toDateKey(new Date())) cell.classList.add("today");

    cell.innerHTML = `
      <span class="calendar-day-number">${date.getDate()}</span>
      ${count ? `<span class="calendar-count">${count}</span>` : ""}
    `;
    cell.addEventListener("click", () => {
      selectedCalendarDate = dateKey;
      setDateFilter(dateKey);
      const overlay = document.getElementById("calendar-overlay");
      if (overlay) overlay.classList.add("hidden");
      renderCalendar(readTasksFromStorage());
      renderCalendarTasks(readTasksFromStorage());
    });
    grid.appendChild(cell);
  }
  renderCalendarTasks(tasks);
}

function bindAsideControls() {
  const drawerBtn = document.getElementById("aside-toggle-btn");
  const closeBtn = document.getElementById("aside-close-btn");
  const aside = document.getElementById("board-aside");
  const overlay = document.getElementById("calendar-overlay");
  const openCalendar = document.getElementById("open-calendar-btn");
  const closeCalendar = document.getElementById("close-calendar-btn");
  const prevMonth = document.getElementById("calendar-prev");
  const nextMonth = document.getElementById("calendar-next");
  const allButton = document.getElementById("due-filter-all");

  drawerBtn?.addEventListener("click", () => aside?.classList.add("open"));
  closeBtn?.addEventListener("click", () => aside?.classList.remove("open"));
  allButton?.addEventListener("click", () => setDateFilter(null));

  openCalendar?.addEventListener("click", () => {
    overlay?.classList.remove("hidden");
    renderCalendar(readTasksFromStorage());
  });
  closeCalendar?.addEventListener("click", () => overlay?.classList.add("hidden"));
  overlay?.addEventListener("click", (event) => {
    if (event.target === overlay) overlay.classList.add("hidden");
  });

  prevMonth?.addEventListener("click", () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    renderCalendar(readTasksFromStorage());
  });
  nextMonth?.addEventListener("click", () => {
    calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    renderCalendar(readTasksFromStorage());
  });
}

function refreshAside() {
  const tasks = readTasksFromStorage();
  renderFocus(tasks);
  renderDueStrip(tasks);
  renderCalendar(tasks);
}

function initBoardAside() {
  bindAsideControls();
  refreshAside();
  window.addEventListener("kanba:tasks-updated", refreshAside);
  window.addEventListener("kanba:tasks-rendered", refreshAside);
  document.addEventListener("kanba:date-filter-changed", refreshAside);
}

export { initBoardAside, refreshAside };
