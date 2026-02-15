import { initCommon } from "./page-common.js";
import { applyTranslations, highlightActiveLanguage } from "./dictionary.js";
import { simulateFakeTasksWithTags, simulateWarningsData, simulateFakeTrendData, simulateInsightsData, simulatePriorityTrends, simulateTagCompletionData } from "./simulation.js";

function announceTaskDataChanged() {
  window.dispatchEvent(new CustomEvent("kanba:tasks-updated"));
}

function setDarkMode(isDark) {
  document.body.classList.toggle("dark", isDark);
  document.documentElement.classList.toggle("dark", isDark);
  try {
    localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
  } catch {
    // Ignore storage errors in restrictive environments.
  }
}

function bindDarkModeToggle() {
  const toggle = document.getElementById("dark-mode-toggle");
  const status = document.getElementById("dark-mode-status");
  if (!toggle) return;

  const isDark = document.body.classList.contains("dark") || localStorage.getItem("darkMode") === "enabled";
  toggle.textContent = isDark ? "On" : "Off";
  if (status) status.textContent = isDark ? "On" : "Off";

  toggle.addEventListener("click", () => {
    const enabled = !document.body.classList.contains("dark");
    setDarkMode(enabled);
    toggle.textContent = enabled ? "On" : "Off";
    if (status) status.textContent = enabled ? "On" : "Off";
  });
}

function bindLanguageButtons() {
  document.querySelectorAll(".language-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.dataset.lang;
      localStorage.setItem("kanbaLang", lang);
      applyTranslations(lang);
      highlightActiveLanguage(lang);
    });
  });
}

function bindSimulationToggle() {
  const toggle = document.getElementById("sim-toggle");
  const status = document.getElementById("sim-status");
  if (!toggle) return;

  const isSimOn = Boolean(localStorage.getItem("kanbaSimulated"));
  toggle.textContent = isSimOn ? "On" : "Off";
  if (status) status.textContent = isSimOn ? "On" : "Off";

  toggle.addEventListener("click", () => {
    if (!localStorage.getItem("kanbaSimulated")) {
      simulateFakeTasksWithTags();
      simulateWarningsData();
      simulateFakeTrendData();
      simulateInsightsData();
      simulatePriorityTrends();
      simulateTagCompletionData();
      localStorage.setItem("kanbaSimulated", "true");
      localStorage.removeItem("kanbaActivityMetrics");
      toggle.textContent = "On";
      if (status) status.textContent = "On";
      announceTaskDataChanged();
    } else {
      localStorage.removeItem("kanbaSimulated");
      localStorage.removeItem("kanbaTasks");
      localStorage.removeItem("kanbaTrends");
      localStorage.removeItem("kanbaSimVersion");
      localStorage.removeItem("kanbaActivityMetrics");
      toggle.textContent = "Off";
      if (status) status.textContent = "Off";
      announceTaskDataChanged();
    }
  });
}

window.addEventListener("DOMContentLoaded", () => {
  initCommon();
  bindDarkModeToggle();
  bindLanguageButtons();
  bindSimulationToggle();
  window.__kanbaSettingsBound = true;
});
