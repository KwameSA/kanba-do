const ACTIVITY_OPTIONS = [
  "Deep Work",
  "Learning",
  "Fitness",
  "Admin",
  "Creative",
  "Errands",
  "Social",
  "Rest",
];

const LAST_ACTIVITY_KEY = "kanbaLastActivityType";
const CUSTOM_VALUE = "custom";

function isPredefinedActivity(value) {
  return ACTIVITY_OPTIONS.includes(value);
}

function getLastActivityType() {
  try {
    return localStorage.getItem(LAST_ACTIVITY_KEY) || "";
  } catch {
    return "";
  }
}

function setLastActivityType(value) {
  try {
    if (value) {
      localStorage.setItem(LAST_ACTIVITY_KEY, value);
    } else {
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    }
  } catch {}
}

function resolveActivitySelection(value) {
  if (value && isPredefinedActivity(value)) {
    return { selectValue: value, customValue: "" };
  }
  if (value) {
    return { selectValue: CUSTOM_VALUE, customValue: value };
  }
  return { selectValue: "", customValue: "" };
}

function getActivityTypeFromControls(selectValue, customValue) {
  if (!selectValue) return "";
  if (selectValue === CUSTOM_VALUE) {
    return (customValue || "").trim();
  }
  return selectValue;
}

function applyActivityToControls(selectEl, customEl, value) {
  const selection = resolveActivitySelection(value);
  selectEl.value = selection.selectValue;
  customEl.value = selection.customValue;
  customEl.style.display = selection.selectValue === CUSTOM_VALUE ? "block" : "none";
}

export {
  ACTIVITY_OPTIONS,
  CUSTOM_VALUE,
  applyActivityToControls,
  getActivityTypeFromControls,
  getLastActivityType,
  isPredefinedActivity,
  resolveActivitySelection,
  setLastActivityType,
};
