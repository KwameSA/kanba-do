import { applyTranslations, highlightActiveLanguage } from "./dictionary.js";

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

  document.documentElement.classList.remove("i18n-loading");
}
