import { addEntry, showTask } from "./tasks.js";
import { sortTasks, updateTagFilterUI } from "./filters.js";
import { elements, containers } from "./constants.js";
import { applyTranslations } from "./dictionary.js";

let activeTagFilter = null;

export function bindBoardEvents() {
  const addButton = document.getElementById("add-button");
  if (addButton) {
    addButton.addEventListener("click", addEntry);
  }

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

  if (elements.cancelReset) {
    elements.cancelReset.addEventListener("click", () => {
      elements.resetModal.classList.add("hidden");
    });
  }

  if (elements.cancelModal) {
    elements.cancelModal.addEventListener("click", () => {
      elements.taskModal.style.display = "none";
    });
  }

  if (elements.confirmReset) {
    elements.confirmReset.addEventListener("click", () => {
      localStorage.removeItem("kanbaTasks");
      showTask();
      elements.resetModal.classList.add("hidden");
    });
  }

  if (elements.taskViewSelect) {
    elements.taskViewSelect.addEventListener("change", (e) => {
      const value = e.target.value;

      if (value.startsWith("sort-")) {
        const mode = value.replace("sort-", "");
        ["do", "doing", "done"].forEach((section) => {
          sortTasks(section, mode);
        });
      } else if (value.startsWith("filter-")) {
        const filter = value.replace("filter-", "");

        document.querySelectorAll(".task-item").forEach((task) => {
          const priority = task.dataset.priority;
          const isOverdue = task.classList.contains("overdue");
          const isDueSoon = task.classList.contains("due-soon");

          if (filter === "all") {
            task.style.display = "flex";
          } else if (filter === "overdue") {
            task.style.display = isOverdue ? "flex" : "none";
          } else if (filter === "duesoon") {
            task.style.display = isDueSoon ? "flex" : "none";
          } else {
            task.style.display = priority === filter ? "flex" : "none";
          }
        });
      }
    });
  }

  if (elements.searchStatus) {
    elements.searchStatus.addEventListener("input", () => {
      const term = elements.searchStatus.value.trim().toLowerCase();
      const info = document.getElementById("search-info");

      if (info) {
        info.style.display = term.length > 0 ? "block" : "none";
      }

      if (term.length > 0) {
        activeTagFilter = null;
        updateTagFilterUI(null);
      }

      ["do", "doing", "done"].forEach((section) => {
        Array.from(containers[section].children).forEach((li) => {
          const taskTextEl = li.querySelector(".task-text");
          const originalText = taskTextEl?.dataset.originalText || taskTextEl.textContent;
          const title = originalText.toLowerCase();
          const description = (li.dataset.description || "").toLowerCase();
          const tags = (li.dataset.tags || "").toLowerCase();

          const tagMatches =
            !activeTagFilter ||
            (li.dataset.tags || "")
              .split(",")
              .map((t) => t.trim())
              .includes(activeTagFilter);

          const searchMatches = title.includes(term) || description.includes(term) || tags.includes(term);

          const show = searchMatches && tagMatches;
          li.style.display = show ? "flex" : "none";

          if (term && title.includes(term)) {
            const matchStart = title.indexOf(term);
            const matchEnd = matchStart + term.length;
            const before = originalText.slice(0, matchStart);
            const match = originalText.slice(matchStart, matchEnd);
            const after = originalText.slice(matchEnd);
            taskTextEl.innerHTML = `${before}<mark>${match}</mark>${after}`;
            taskTextEl.dataset.originalText = originalText;
          } else {
            taskTextEl.innerHTML = originalText;
          }
        });
      });
    });
  }

  const clearTagButton = document.getElementById("clear-tag-filter");
  if (clearTagButton) {
    clearTagButton.addEventListener("click", () => {
      activeTagFilter = null;
      updateTagFilterUI(null);
      showTask();
    });
  }

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
      if (elements.taskModal && elements.taskModal.style.display === "flex") {
        elements.taskModal.style.display = "none";
      }

      if (elements.resetModal && !elements.resetModal.classList.contains("hidden")) {
        elements.resetModal.classList.add("hidden");
      }
    }
  });
}
