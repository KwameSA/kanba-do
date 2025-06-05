import { addEntry, showTask } from "./tasks.js";
import { openPanel, closeAllPanels } from "./panels.js";
import { renderAnalyticsChart, renderTrendChart, renderTagChart, renderInsights, renderCompletionChart, renderPriorityTrends, renderCompletionByTag, renderWarnings, renderOverdueTasks } from "./analytics.js";
import { sortTasks, updateTagFilterUI } from "./filters.js";
import { applyTranslations, highlightActiveLanguage } from "./dictionary.js";
import { elements, containers } from "./constants.js";
import { exportTasksToCSV, exportToPDF, downloadChartImage } from "./export.js";

import { bindModalEvents } from "./modals.js";

// When opening the modal and setting currentTaskElement:
bindModalEvents();

// Temporary global (or manage via state manager)
let activeTagFilter = null;

export function bindGlobalEvents() {
  elements.inputBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addEntry();
  });

  elements.inputBox.addEventListener("focus", () => {
    elements.errorMessage.style.display = "none";
  });

  elements.cancelModal.addEventListener("click", () => {
    elements.taskModal.style.display = "none";
  });

  // elements.cancelModal.addEventListener("keydown", (e) => {
  //   if (e.key === "Escape") {
  //     elements.taskModal.style.display = "none";
  //   }
  // });

  elements.resetBtn.addEventListener("click", () => {
    elements.resetModal.classList.remove("hidden"); // ✅ show first
    setTimeout(() => {
      const lang = localStorage.getItem("kanbaLang") || "en";
      applyTranslations(lang);
    }, 50);
  });

  elements.cancelReset.addEventListener("click", () => {
    elements.resetModal.classList.add("hidden");
  });

  elements.confirmReset.addEventListener("click", () => {
    localStorage.removeItem("kanbaTasks");
    showTask();
    elements.resetModal.classList.add("hidden");
  });

  document.getElementById("notifications").addEventListener("click", () => {
    openPanel("notifications-panel", renderOverdueTasks);
  });

  document.getElementById("language-toggle").addEventListener("click", () => {
    openPanel("language-panel");
  });

  document.getElementById("open-import-export").addEventListener("click", () => {
    openPanel("import-export-panel");
  });

  document.getElementById("open-faq").addEventListener("click", () => {
    openPanel("faq-panel");
  });

  document.getElementById("open-analytics").addEventListener("click", () => {
    openPanel("analytics-panel", () => {
      renderAnalyticsChart();
      renderTrendChart();
      renderTagChart();
      renderInsights();
      renderCompletionChart();
      renderPriorityTrends();
      renderCompletionByTag();
      renderWarnings();
    });
  });

  document.getElementById("export-pdf-full").addEventListener("click", async () => {
    const fullPanel = document.getElementById("analytics-content");

    // Clone the analytics content
    const clone = fullPanel.cloneNode(true);
    clone.id = "print-clone";
    clone.style.position = "fixed";
    clone.style.top = "0";
    clone.style.left = "0";
    clone.style.zIndex = "9999";
    clone.style.background = "white";
    clone.style.padding = "20px";
    clone.style.maxHeight = "100vh";
    clone.style.overflowY = "auto";
    clone.style.opacity = "1";
    clone.style.boxShadow = "0 0 20px rgba(0,0,0,0.3)";
    document.body.appendChild(clone);

    // Define the tabs and their render logic
    const tabs = [
      { id: "tab-overview", render: renderAnalyticsChart, canvasId: "overviewChart" },
      { id: "tab-trends", render: renderTrendChart, canvasId: "trendChart" },
      { id: "tab-tags", render: renderTagChart, canvasId: "tagChart" },
      {
        id: "tab-insights",
        render: () => {
          renderInsights();
          renderCompletionChart();
          renderCompletionByTag();
          renderPriorityTrends();
        },
        canvasId: "completionTimeChart",
      },
      { id: "tab-warnings", render: renderWarnings, canvasId: "warningsChart" },
    ];

    const cloneCanvases = clone.querySelectorAll("canvas");
    let cloneIndex = 0;

    for (const { id, render, canvasId } of tabs) {
      // Show only the current tab
      document.querySelectorAll(".analytics-tab").forEach((tab) => tab.classList.add("hidden"));
      const tabEl = document.getElementById(id);
      if (tabEl) tabEl.classList.remove("hidden");

      render(); // Render chart
      await new Promise((r) => setTimeout(r, 500)); // Wait for chart to draw

      const originalCanvas = document.getElementById(canvasId);
      const cloneCanvas = cloneCanvases[cloneIndex];

      if (originalCanvas && cloneCanvas) {
        try {
          const img = new Image();
          img.src = originalCanvas.toDataURL("image/png");
          img.width = originalCanvas.width;
          img.height = originalCanvas.height;
          cloneCanvas.replaceWith(img);
        } catch (err) {
          console.warn("Could not convert canvas to image:", err);
        }
      }

      cloneIndex++;
    }

    // Reveal all tabs in the clone
    clone.querySelectorAll(".analytics-tab").forEach((tab) => tab.classList.remove("hidden"));

    // Restore original view
    document.querySelectorAll(".analytics-tab").forEach((tab) => tab.classList.add("hidden"));
    const lastTab = document.querySelector(".tab-btn.active")?.dataset?.tab;
    if (lastTab) document.getElementById(`tab-${lastTab}`).classList.remove("hidden");

    // Export after short delay
    setTimeout(() => {
      exportToPDF(clone, "kanba-full-report.pdf");
      document.body.removeChild(clone);
    }, 500);
  });

  document.getElementById("export-pdf-current").addEventListener("click", () => {
    const currentTab = document.querySelector(".analytics-tab:not(.hidden)");
    if (currentTab) {
      exportToPDF(currentTab, "kanba-current-tab.pdf");
    } else {
      alert("No active tab found.");
    }
  });

  document.getElementById("import-btn").addEventListener("click", () => {
    const text = document.getElementById("import-textarea").value.trim();
    try {
      const tasks = JSON.parse(text);
      localStorage.setItem("kanbaTasks", JSON.stringify(tasks));
      showTask();
      document.getElementById("import-status").textContent = "✅ Tasks imported successfully!";
    } catch (err) {
      document.getElementById("import-status").textContent = "❌ Invalid JSON.";
    }
  });

  document.getElementById("import-file").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const tasks = JSON.parse(event.target.result);
        localStorage.setItem("kanbaTasks", JSON.stringify(tasks));
        showTask();
        document.getElementById("import-status").textContent = "✅ Tasks imported successfully!";
      } catch (err) {
        document.getElementById("import-status").textContent = "❌ Invalid file.";
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    const data = localStorage.getItem("kanbaTasks");
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kanba_tasks_backup.json";
    a.click();
    URL.revokeObjectURL(url);
  });

  document.querySelectorAll(".download-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const chartId = btn.dataset.chartId;
      downloadChartImage(chartId);
    });
  });

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

  elements.searchStatus.addEventListener("input", () => {
    const term = elements.searchStatus.value.trim().toLowerCase();
    const info = document.getElementById("search-info");

    if (term.length > 0) {
      info.style.display = "block";
    } else {
      info.style.display = "none";
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

  document.getElementById("clear-tag-filter").addEventListener("click", () => {
    activeTagFilter = null;
    updateTagFilterUI(null);
    showTask();
  });

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

  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
      document.querySelectorAll(".analytics-tab").forEach((tab) => tab.classList.add("hidden"));

      button.classList.add("active");
      const tabId = "tab-" + button.dataset.tab;
      document.getElementById(tabId).classList.remove("hidden");

      if (tabId === "tab-overview") renderAnalyticsChart();
      if (tabId === "tab-trends") renderTrendChart();
      if (tabId === "tab-tags") renderTagChart();
      if (tabId === "tab-insights") {
        renderInsights();
        renderCompletionChart();
        renderPriorityTrends();
        renderCompletionByTag();
      }
      if (tabId === "tab-warnings") renderWarnings();
    });
  });

  document.querySelectorAll(".insights-tabs button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.insight;

      document.querySelectorAll(".insights-tabs button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".insight-card").forEach((card) => {
        card.classList.add("hidden");
      });

      if (target === "completion") {
        document.querySelector(".completion-card").classList.remove("hidden");
        document.getElementById("completionTimeChart").classList.remove("hidden");
      } else if (target === "priority") {
        document.querySelector(".priority-card").classList.remove("hidden");
        document.getElementById("priorityTrendChart").classList.remove("hidden");
      } else if (target === "tag") {
        document.querySelector(".tag-card").classList.remove("hidden");
        document.getElementById("completionRateByTagChart").classList.remove("hidden");
      }
    });
  });

  elements.darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    const isDark = document.body.classList.contains("dark");

    const icon = elements.darkModeIcon;
    icon.classList.remove(isDark ? "fa-moon" : "fa-sun");
    icon.classList.add(isDark ? "fa-sun" : "fa-moon");

    localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      // Close task modal if open
      if (elements.taskModal.style.display === "flex") {
        elements.taskModal.style.display = "none";
      }

      // Close reset modal if visible
      if (!elements.resetModal.classList.contains("hidden")) {
        elements.resetModal.classList.add("hidden");
      }

      // Close any panel that’s open
      closeAllPanels();
    }
  });

  document.querySelectorAll(".language-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      localStorage.setItem("kanbaLang", lang);
      applyTranslations(lang);
      highlightActiveLanguage(lang);

      document.querySelectorAll(".language-button").forEach((b) => b.classList.remove("selected-language"));
      btn.classList.add("selected-language");
    });
  });
}
