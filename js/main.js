import { bindGlobalEvents } from "./events.js";
import { bindPanelEvents } from "./panels.js";
import { showTask, updateNotifications, addEntry } from "./tasks.js";
import { initSimulationToggle } from "./simulation.js";
import { applyTranslations, highlightActiveLanguage } from "./dictionary.js";

// Run everything only after DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  const lang = localStorage.getItem("kanbaLang") || "en";
  document.getElementById("add-button").addEventListener("click", addEntry);

  // Set footer year
  document.getElementById("currentYear").textContent = new Date().getFullYear();

  if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark");
    const icon = document.getElementById("moon-icon");
    icon?.classList.remove("fa-moon");
    icon?.classList.add("fa-sun");
  }

  applyTranslations(lang);
  highlightActiveLanguage(lang);
  setTimeout(() => highlightActiveLanguage(lang), 50);

  bindGlobalEvents();
  bindPanelEvents();
  initSimulationToggle();

  showTask();
  updateNotifications();
});
