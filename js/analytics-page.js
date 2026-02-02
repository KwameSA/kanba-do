import { initCommon } from "./page-common.js";
import { renderAnalyticsChart, renderTrendChart, renderTagChart, renderInsights, renderCompletionChart, renderPriorityTrends, renderCompletionByTag, renderWarnings } from "./analytics.js";
import { exportTasksToCSV, exportToPDF, downloadChartImage } from "./export.js";
import { translations } from "./dictionary.js";

function bindExportButtons() {
  const exportFull = document.getElementById("export-pdf-full");
  const exportCurrent = document.getElementById("export-pdf-current");
  const exportCsv = document.getElementById("export-csv-btn");

  if (exportFull) {
    exportFull.addEventListener("click", async () => {
      const fullPanel = document.getElementById("analytics-content");
      if (!fullPanel) return;

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

      const charts = [
        { render: renderAnalyticsChart, canvasId: "statusChart" },
        { render: renderTrendChart, canvasId: "trendChart" },
        { render: renderTagChart, canvasId: "tagChart" },
        {
          render: () => {
            renderInsights();
            renderCompletionChart();
            renderCompletionByTag();
            renderPriorityTrends();
          },
          canvasId: "completionTimeChart",
        },
      ];

      const cloneCanvases = clone.querySelectorAll("canvas");
      let cloneIndex = 0;

      for (const { render, canvasId } of charts) {
        render();
        await new Promise((r) => setTimeout(r, 500));

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

      setTimeout(() => {
        exportToPDF(clone, "kanba-full-report.pdf");
        document.body.removeChild(clone);
      }, 500);
    });
  }

  if (exportCurrent) {
    exportCurrent.addEventListener("click", () => {
      const currentTab = document.querySelector(".analytics-tab:not(.hidden)");
      if (currentTab) {
        exportToPDF(currentTab, "kanba-current-tab.pdf");
      } else {
        alert("No active tab found.");
      }
    });
  }

  if (exportCsv) {
    exportCsv.addEventListener("click", exportTasksToCSV);
  }

  document.querySelectorAll(".download-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const chartId = btn.dataset.chartId;
      downloadChartImage(chartId);
    });
  });
}

function renderInsightCards() {
  const lang = localStorage.getItem("kanbaLang") || "en";
  const t = (key, fallback = key) => translations?.[lang]?.[key] || fallback;
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];
  const total = tasks.length;
  const overdue = tasks.filter((task) => {
    if (!task.duedate || task.status === "done") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.duedate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  const completed = tasks.filter((task) => task.status === "done" && task.completedAt);
  const durations = completed.map((t) => {
    const start = new Date(t.dateAdded);
    const end = new Date(t.completedAt);
    return (end - start) / (1000 * 60 * 60 * 24);
  });
  const avg = durations.length ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1) : t("N/A", "N/A");

  const tagCounts = {};
  tasks.forEach((task) => {
    (task.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
  });
  const topTag = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a])[0];

  document.getElementById("insight-total").textContent = total;
  document.getElementById("insight-overdue").textContent = overdue;
  document.getElementById("insight-avg").textContent = avg === t("N/A", "N/A") ? t("N/A", "N/A") : `${avg} ${t("days", "days")}`;
  document.getElementById("insight-top-tag").textContent = topTag ? `#${topTag}` : t("None", "None");
}

window.addEventListener("DOMContentLoaded", () => {
  initCommon();
  renderInsightCards();
  renderAnalyticsChart();
  renderTrendChart();
  renderTagChart();
  renderInsights();
  renderCompletionChart();
  renderPriorityTrends();
  renderCompletionByTag();
  renderWarnings();
  bindExportButtons();
});
