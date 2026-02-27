import { normalizeRecurrence } from "./recurrence.js";

const VALID_STATUSES = new Set(["do", "doing", "done"]);
const STATUS_TO_STAGE = {
  do: "DO",
  doing: "DOING",
  done: "DONE",
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeStatus(status) {
  return VALID_STATUSES.has(status) ? status : "do";
}

function statusToStage(status) {
  return STATUS_TO_STAGE[normalizeStatus(status)];
}

function normalizeIso(value, fallback) {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
}

function normalizeIsoOrNull(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function normalizeNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function normalizeOutcome(value) {
  if (value === "done" || value === "canceled") return value;
  return null;
}

function normalizeTimeLogs(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      const startAt = normalizeIsoOrNull(entry?.startAt);
      const endAt = normalizeIsoOrNull(entry?.endAt);
      if (!startAt || !endAt) return null;
      return { startAt, endAt };
    })
    .filter(Boolean);
}

function computeActualDurationMin(timeLogs) {
  if (!Array.isArray(timeLogs) || timeLogs.length === 0) return null;
  const totalMs = timeLogs.reduce((sum, log) => {
    const start = new Date(log.startAt).getTime();
    const end = new Date(log.endAt).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return sum;
    return sum + (end - start);
  }, 0);
  if (totalMs <= 0) return null;
  return Math.round(totalMs / 60000);
}

function normalizeRhythm(value) {
  return {
    acceptedAt: normalizeIsoOrNull(value?.acceptedAt) || null,
    declinedUntil: normalizeIsoOrNull(value?.declinedUntil) || null,
    recommendationSource: typeof value?.recommendationSource === "string" ? value.recommendationSource : null,
    recommendationCount: Number.isFinite(Number(value?.recommendationCount)) ? Number(value.recommendationCount) : 0,
  };
}

function generateTaskId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `task-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function normalizeStageHistory(history, status, createdAt) {
  const fallback = [{ stage: statusToStage(status), enteredAt: createdAt }];
  if (!Array.isArray(history) || history.length === 0) return fallback;

  const normalized = history
    .map((entry) => {
      const stage = typeof entry?.stage === "string" ? entry.stage.toUpperCase() : statusToStage(status);
      const enteredAt = normalizeIso(entry?.enteredAt, createdAt);
      if (!["DO", "DOING", "DONE"].includes(stage)) return null;
      return { stage, enteredAt };
    })
    .filter(Boolean);

  return normalized.length ? normalized : fallback;
}

function normalizeTask(task, now = nowIso()) {
  const status = normalizeStatus(task?.status);
  const createdAt = normalizeIso(task?.createdAt || task?.dateAdded, now);
  const updatedAt = normalizeIso(task?.updatedAt || task?.createdAt || task?.dateAdded, now);
  const stageHistory = normalizeStageHistory(task?.stageHistory, status, createdAt);
  const recurrence = normalizeRecurrence(task?.recurrence);
  const latestStageEntry = stageHistory[stageHistory.length - 1];
  const lastMovedAt = normalizeIso(task?.lastMovedAt || latestStageEntry?.enteredAt || task?.updatedAt || task?.createdAt, updatedAt);
  const completedAt =
    status === "done" ? normalizeIso(task?.completedAt || lastMovedAt || updatedAt, updatedAt) : null;
  const timeLogs = normalizeTimeLogs(task?.timeLogs);

  return {
    id: task?.id || generateTaskId(),
    text: task?.text || "",
    description: task?.description || "",
    priority: task?.priority || "low",
    duedate: task?.duedate || "",
    checked: typeof task?.checked === "boolean" ? task.checked : status === "done",
    dateAdded: normalizeIso(task?.dateAdded || task?.createdAt, createdAt),
    status,
    tags: task?.tags || "",
    activityType: typeof task?.activityType === "string" ? task.activityType : "",
    recurrence,
    completedAt,
    createdAt,
    updatedAt,
    lastMovedAt,
    stageHistory,
    // Migration: new optional fields are normalized with defaults to keep legacy tasks intact.
    estimateMin: normalizeNumberOrNull(task?.estimateMin),
    plannedStartAt: normalizeIsoOrNull(task?.plannedStartAt),
    startedAt: normalizeIsoOrNull(task?.startedAt),
    focusWindowMin: normalizeNumberOrNull(task?.focusWindowMin),
    timeLogs,
    completionNote: typeof task?.completionNote === "string" ? task.completionNote : "",
    outcome: normalizeOutcome(task?.outcome),
    actualDurationMin: computeActualDurationMin(timeLogs),
    rhythm: normalizeRhythm(task?.rhythm),
  };
}

function migrateTasks(tasks) {
  const now = nowIso();
  if (!Array.isArray(tasks)) return [];
  // Migration path: normalizeTask adds missing fields for legacy tasks without removing existing data.
  return tasks.map((task) => normalizeTask(task, now));
}

function readTasksFromStorage() {
  let rawTasks = [];
  try {
    rawTasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];
  } catch {
    rawTasks = [];
  }
  const normalized = migrateTasks(rawTasks);
  localStorage.setItem("kanbaTasks", JSON.stringify(normalized));
  return normalized;
}

function writeTasksToStorage(tasks) {
  const normalized = migrateTasks(tasks);
  localStorage.setItem("kanbaTasks", JSON.stringify(normalized));
  return normalized;
}

function getLatestStageEntry(task) {
  const history = Array.isArray(task?.stageHistory) ? task.stageHistory : [];
  return history[history.length - 1] || null;
}

function appendStageHistory(task, nextStatus, at = nowIso()) {
  const normalizedTask = normalizeTask(task, at);
  const stage = statusToStage(nextStatus);
  const history = [...normalizedTask.stageHistory];
  const latest = history[history.length - 1];

  if (!latest || latest.stage !== stage) {
    history.push({ stage, enteredAt: at });
  }

  return {
    ...normalizedTask,
    status: normalizeStatus(nextStatus),
    updatedAt: at,
    lastMovedAt: at,
    stageHistory: history,
  };
}

function getStageEntries(task, stage) {
  if (!Array.isArray(task?.stageHistory)) return [];
  return task.stageHistory.filter((entry) => entry.stage === stage);
}

export { appendStageHistory, getLatestStageEntry, getStageEntries, migrateTasks, normalizeTask, nowIso, readTasksFromStorage, statusToStage, writeTasksToStorage };
