import { applyTranslations, highlightActiveLanguage } from "./dictionary.js";
import { initPwa } from "./pwa.js";
import { initActivityMetrics } from "./activity-metrics.js";
import { initReflectiveInsights } from "./insights-reflective.js";
import { initSuggestionRules } from "./insights-suggestions.js";

export function initCommon() {
  const lang = localStorage.getItem("kanbaLang") || "en";

  try {
    if (localStorage.getItem("darkMode") === "enabled") {
      document.body.classList.add("dark");
      document.documentElement.classList.add("dark");
    }
  } catch {
    // If storage is blocked, keep the current theme.
  }

  applyTranslations(lang);
  highlightActiveLanguage(lang);
  setTimeout(() => highlightActiveLanguage(lang), 50);
  initPwa();
  initActivityMetrics();
  initReflectiveInsights();
  initSuggestionRules();

  document.documentElement.classList.remove("i18n-loading");
}
