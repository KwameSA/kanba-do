import { addEntry, showTask } from "./tasks.js";
import { sortTasks, updateTagFilterUI } from "./filters.js";
import { elements, containers } from "./constants.js";
import { applyTranslations } from "./dictionary.js";

let activeTagFilter = null;
let activeDateFilter = null;
let activeViewFilter = "all";

function updateDateFilterIndicator() {
  const indicator = document.getElementById("date-filter-indicator");
  const label = document.getElementById("active-date-label");
  if (!indicator || !label) return;
  if (activeDateFilter) {
    indicator.style.display = "block";
    label.textContent = activeDateFilter;
  } else {
    indicator.style.display = "none";
    label.textContent = "";
  }
}

function applySearchHighlight(taskTextEl, term) {
  const originalText = taskTextEl?.dataset.originalText || taskTextEl.textContent;
  if (!term) {
    taskTextEl.innerHTML = originalText;
    return;
  }
  const title = originalText.toLowerCase();
  if (!title.includes(term)) {
    taskTextEl.innerHTML = originalText;
    return;
  }
  const matchStart = title.indexOf(term);
  const matchEnd = matchStart + term.length;
  const before = originalText.slice(0, matchStart);
  const match = originalText.slice(matchStart, matchEnd);
  const after = originalText.slice(matchEnd);
  taskTextEl.innerHTML = `${before}<mark>${match}</mark>${after}`;
  taskTextEl.dataset.originalText = originalText;
}

function taskMatchesViewFilter(task) {
  const priority = task.dataset.priority;
  const isOverdue = task.classList.contains("overdue");
  const isDueSoon = task.classList.contains("due-soon");
  if (activeViewFilter === "all") return true;
  if (activeViewFilter === "overdue") return isOverdue;
  if (activeViewFilter === "duesoon") return isDueSoon;
  return priority === activeViewFilter;
}

function taskMatchesDateFilter(task) {
  if (!activeDateFilter) return true;
  return (task.dataset.duedate || "") === activeDateFilter;
}

function taskMatchesSearchAndTag(task, term) {
  const taskTextEl = task.querySelector(".task-text");
  const originalText = taskTextEl?.dataset.originalText || taskTextEl.textContent;
  const title = originalText.toLowerCase();
  const description = (task.dataset.description || "").toLowerCase();
  const tags = (task.dataset.tags || "").toLowerCase();
  const tagList = (task.dataset.tags || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const tagMatches = !activeTagFilter || tagList.includes(activeTagFilter);
  const searchMatches = !term || title.includes(term) || description.includes(term) || tags.includes(term);
  applySearchHighlight(taskTextEl, term);
  return tagMatches && searchMatches;
}

function applyBoardFilters() {
  const term = elements.searchStatus?.value.trim().toLowerCase() || "";
  const info = document.getElementById("search-info");
  if (info) info.style.display = term.length > 0 ? "block" : "none";

  ["do", "doing", "done"].forEach((section) => {
    Array.from(containers[section].children).forEach((task) => {
      const show =
        taskMatchesSearchAndTag(task, term) &&
        taskMatchesDateFilter(task) &&
        taskMatchesViewFilter(task);
      task.style.display = show ? "flex" : "none";
    });
  });

  updateDateFilterIndicator();
}

function setDateFilter(dateKey) {
  activeDateFilter = dateKey || null;
  applyBoardFilters();
  document.dispatchEvent(new CustomEvent("kanba:date-filter-changed"));
}

function getActiveDateFilter() {
  return activeDateFilter;
}

export { applyBoardFilters, getActiveDateFilter, setDateFilter };

export function bindBoardEvents() {
  const addButton = document.getElementById("add-button");
  if (addButton) addButton.addEventListener("click", addEntry);

  if (elements.inputBox) {
    elements.inputBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter") addEntry();
    });
    elements.inputBox.addEventListener("focus", () => {
      if (elements.errorMessage) elements.errorMessage.style.display = "none";
    });
  }

  if (elements.resetBtn) {
    elements.resetBtn.addEventListener("click", () => {
      elements.resetModal.classList.remove("hidden");
      setTimeout(() => {
        const lang = localStorage.getItem("kanbaLang") || "en";
        applyTranslations(lang);
      }, 50);
    });
  }

  elements.cancelReset?.addEventListener("click", () => elements.resetModal.classList.add("hidden"));
  elements.cancelModal?.addEventListener("click", () => (elements.taskModal.style.display = "none"));

  elements.confirmReset?.addEventListener("click", () => {
    localStorage.removeItem("kanbaTasks");
    showTask();
    elements.resetModal.classList.add("hidden");
  });

  if (elements.taskViewSelect) {
    elements.taskViewSelect.addEventListener("change", (e) => {
      const value = e.target.value;
      if (value.startsWith("sort-")) {
        const mode = value.replace("sort-", "");
        ["do", "doing", "done"].forEach((section) => sortTasks(section, mode));
      } else if (value.startsWith("filter-")) {
        activeViewFilter = value.replace("filter-", "");
      }
      applyBoardFilters();
    });
  }

  elements.searchStatus?.addEventListener("input", () => {
    const term = elements.searchStatus.value.trim().toLowerCase();
    if (term.length > 0) {
      activeTagFilter = null;
      document.body.dataset.activeTagFilter = "";
      updateTagFilterUI(null);
    }
    applyBoardFilters();
  });

  document.addEventListener("kanba:set-tag-filter", (event) => {
    activeTagFilter = event.detail?.tag || null;
    document.body.dataset.activeTagFilter = activeTagFilter || "";
    updateTagFilterUI(activeTagFilter);
    applyBoardFilters();
  });

  const clearTagButton = document.getElementById("clear-tag-filter");
  clearTagButton?.addEventListener("click", () => {
    activeTagFilter = null;
    document.body.dataset.activeTagFilter = "";
    updateTagFilterUI(null);
    applyBoardFilters();
  });

  const clearDateButton = document.getElementById("clear-date-filter");
  clearDateButton?.addEventListener("click", () => setDateFilter(null));

  document.querySelectorAll(".top-btn-nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;
      localStorage.setItem("lastSection", target);
      document.querySelectorAll(".todo-app, .todoing-app, .todone-app").forEach((el) => {
        el.style.display = "none";
      });
      document.querySelector(`.${target}`).style.display = "block";
    });
  });

  document.querySelectorAll("button, select, input, textarea").forEach((el) => {
    el.setAttribute("tabindex", "0");
  });

  document.querySelectorAll(".delete, .move, .move-btn").forEach((btn) => {
    btn.setAttribute("aria-label", btn.textContent.trim() || "action");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (elements.taskModal?.style.display === "flex") {
        elements.taskModal.style.display = "none";
      }
      if (elements.resetModal && !elements.resetModal.classList.contains("hidden")) {
        elements.resetModal.classList.add("hidden");
      }
    }
  });

  window.addEventListener("kanba:tasks-rendered", applyBoardFilters);
  applyBoardFilters();
}
