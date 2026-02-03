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
    completedAt: task?.completedAt || null,
    createdAt,
    updatedAt,
    stageHistory,
  };
}

function migrateTasks(tasks) {
  const now = nowIso();
  if (!Array.isArray(tasks)) return [];
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
    stageHistory: history,
  };
}

function getStageEntries(task, stage) {
  if (!Array.isArray(task?.stageHistory)) return [];
  return task.stageHistory.filter((entry) => entry.stage === stage);
}

export { appendStageHistory, getLatestStageEntry, getStageEntries, migrateTasks, normalizeTask, nowIso, readTasksFromStorage, statusToStage, writeTasksToStorage };
