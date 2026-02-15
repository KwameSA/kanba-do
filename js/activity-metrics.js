import { readTasksFromStorage } from "./task-model.js";
import { BUCKET_HOURS, getTimeBucket } from "./time-buckets.js";

const METRICS_KEY = "kanbaActivityMetrics";
const STAGE_ORDER = { DO: 0, DOING: 1, DONE: 2 };

function buildTaskSignature(tasks) {
  const rows = (Array.isArray(tasks) ? tasks : []).map((task) => {
    const historyLen = Array.isArray(task?.stageHistory) ? task.stageHistory.length : 0;
    return [
      task?.id || "",
      task?.status || "",
      task?.activityType || "",
      task?.duedate || "",
      task?.completedAt || "",
      task?.updatedAt || "",
      historyLen,
    ].join("|");
  });
  rows.sort();
  return `${rows.length}:${rows.join("~")}`;
}

function normalizeActivityType(value) {
  const cleaned = typeof value === "string" ? value.trim() : "";
  return cleaned;
}

function countReschedules(task) {
  const history = Array.isArray(task?.stageHistory) ? task.stageHistory : [];
  if (history.length < 2) return 0;
  let reschedules = 0;
  for (let i = 1; i < history.length; i += 1) {
    const prev = STAGE_ORDER[history[i - 1]?.stage] ?? 0;
    const next = STAGE_ORDER[history[i]?.stage] ?? prev;
    if (next < prev) reschedules += 1;
  }
  return reschedules;
}

function createBucket() {
  return {
    completionCount: 0,
    onTimeCount: 0,
    lateDelayTotalMinutes: 0,
    lateDelaySamples: 0,
    rescheduleCount: 0,
  };
}

function finalizeBuckets(buckets) {
  Object.keys(buckets).forEach((activityKey) => {
    Object.keys(buckets[activityKey]).forEach((bucketKey) => {
      const raw = buckets[activityKey][bucketKey];
      const averageDelayMinutes = raw.lateDelaySamples ? raw.lateDelayTotalMinutes / raw.lateDelaySamples : null;
      const onTimeRate = raw.completionCount ? raw.onTimeCount / raw.completionCount : 0;
      const rescheduleFrequency = raw.completionCount ? raw.rescheduleCount / raw.completionCount : 0;
      buckets[activityKey][bucketKey] = {
        completionCount: raw.completionCount,
        onTimeCount: raw.onTimeCount,
        onTimeRate,
        sampleSize: raw.completionCount,
        avgDelayMinutes: averageDelayMinutes,
        rescheduleFrequency,
        rescheduleCount: raw.rescheduleCount,
      };
    });
  });
  return buckets;
}

function computeActivityMetrics(tasks, now = new Date()) {
  const buckets = {};

  tasks.forEach((task) => {
    if (!task?.completedAt) return;
    const activityKey = normalizeActivityType(task.activityType);
    if (!activityKey) return;
    const completedAt = new Date(task.completedAt);
    if (Number.isNaN(completedAt.getTime())) return;

    const bucketKey = getTimeBucket(completedAt);

    if (!buckets[activityKey]) buckets[activityKey] = {};
    if (!buckets[activityKey][bucketKey]) buckets[activityKey][bucketKey] = createBucket();

    const bucket = buckets[activityKey][bucketKey];
    bucket.completionCount += 1;

    if (task.duedate) {
      const dueEnd = new Date(`${task.duedate}T23:59:59`);
      if (!Number.isNaN(dueEnd.getTime())) {
        if (completedAt <= dueEnd) bucket.onTimeCount += 1;
        const delayMinutes = (completedAt - dueEnd) / (1000 * 60);
        if (delayMinutes > 0) {
          bucket.lateDelayTotalMinutes += delayMinutes;
          bucket.lateDelaySamples += 1;
        }
      }
    }

    bucket.rescheduleCount += countReschedules(task);
  });

  return {
    computedAt: now.toISOString(),
    bucketHours: BUCKET_HOURS,
    buckets: finalizeBuckets(buckets),
  };
}

function storeActivityMetrics(metrics) {
  try {
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  } catch {
    // If storage is blocked, skip persisting metrics.
  }
}

function readActivityMetrics() {
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function recomputeActivityMetrics(tasks = null) {
  const source = tasks || readTasksFromStorage();
  const metrics = computeActivityMetrics(source);
  metrics.sourceSignature = buildTaskSignature(source);
  storeActivityMetrics(metrics);
  return metrics;
}

function readOrRecomputeActivityMetrics(tasks = null) {
  const source = tasks || readTasksFromStorage();
  const sourceSignature = buildTaskSignature(source);
  const cached = readActivityMetrics();
  if (cached?.sourceSignature === sourceSignature) {
    return cached;
  }
  return recomputeActivityMetrics(source);
}

function initActivityMetrics() {
  recomputeActivityMetrics();
  window.addEventListener("kanba:tasks-updated", () => recomputeActivityMetrics());
  window.addEventListener("kanba:tasks-rendered", () => recomputeActivityMetrics());
}

export { computeActivityMetrics, initActivityMetrics, readActivityMetrics, recomputeActivityMetrics, readOrRecomputeActivityMetrics };
