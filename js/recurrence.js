const VALID_TYPES = new Set(["daily", "weekly", "custom"]);

function normalizeRecurrence(value) {
  if (!value) return null;
  if (typeof value === "string") {
    return VALID_TYPES.has(value) ? { type: value } : null;
  }
  if (typeof value !== "object") return null;

  const type = typeof value.type === "string" ? value.type : "";
  if (!VALID_TYPES.has(type)) return null;

  if (type !== "custom") {
    return { type };
  }

  const days = Array.isArray(value.days)
    ? value.days.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    : [];
  if (!days.length) return null;
  const uniqueDays = Array.from(new Set(days)).sort((a, b) => a - b);
  return { type, days: uniqueDays };
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateKey(date) {
  return date.toISOString().split("T")[0];
}

function getNextCustomDate(baseDate, days) {
  if (!days.length) return null;
  const base = startOfDay(baseDate);
  for (let offset = 1; offset <= 14; offset += 1) {
    const candidate = new Date(base);
    candidate.setDate(base.getDate() + offset);
    if (days.includes(candidate.getDay())) return candidate;
  }
  return null;
}

function getNextDueDateKey(completedAtIso, recurrence) {
  const normalized = normalizeRecurrence(recurrence);
  if (!normalized) return "";
  const base = completedAtIso ? new Date(completedAtIso) : new Date();
  if (Number.isNaN(base.getTime())) return "";

  let nextDate = null;
  if (normalized.type === "daily") {
    nextDate = startOfDay(base);
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (normalized.type === "weekly") {
    nextDate = startOfDay(base);
    nextDate.setDate(nextDate.getDate() + 7);
  } else if (normalized.type === "custom") {
    nextDate = getNextCustomDate(base, normalized.days || []);
  }

  return nextDate ? toDateKey(nextDate) : "";
}

export { getNextDueDateKey, normalizeRecurrence };
