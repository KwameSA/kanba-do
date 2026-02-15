import { normalizeRecurrence } from "./recurrence.js";

function applyRecurrenceToControls(selectEl, daysContainer, recurrence) {
  if (!selectEl || !daysContainer) return;
  const normalized = normalizeRecurrence(recurrence);
  const type = normalized?.type || "";
  selectEl.value = type;
  const isCustom = type === "custom";
  daysContainer.style.display = isCustom ? "flex" : "none";
  const days = normalized?.days || [];
  daysContainer.querySelectorAll("input[type=checkbox]").forEach((input) => {
    const value = Number(input.value);
    input.checked = isCustom && days.includes(value);
  });
}

function readRecurrenceFromControls(selectEl, daysContainer) {
  if (!selectEl) return null;
  const type = selectEl.value;
  if (!type) return null;
  if (type !== "custom") return { type };
  if (!daysContainer) return null;
  const days = Array.from(daysContainer.querySelectorAll("input[type=checkbox]"))
    .filter((input) => input.checked)
    .map((input) => Number(input.value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
  if (!days.length) return null;
  return { type, days };
}

export { applyRecurrenceToControls, readRecurrenceFromControls };
