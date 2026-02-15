import { readTasksFromStorage } from "./task-model.js";
import { readActivityMetrics, recomputeActivityMetrics } from "./activity-metrics.js";

const MIN_TASKS = 5;
const MIN_BUCKET_COMPLETIONS = 2;
const MAX_INSIGHTS = 3;

function titleCase(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatBucket(bucketKey) {
  return bucketKey;
}

function describeActivity(activityKey) {
  if (activityKey === "unspecified") return "Uncategorized";
  return titleCase(activityKey);
}

function aggregateBuckets(buckets) {
  const totals = {};
  Object.keys(buckets || {}).forEach((activityKey) => {
    const activityBuckets = buckets[activityKey];
    Object.keys(activityBuckets || {}).forEach((bucketKey) => {
      if (!totals[bucketKey]) {
        totals[bucketKey] = { completionCount: 0, onTimeCount: 0 };
      }
      totals[bucketKey].completionCount += activityBuckets[bucketKey].completionCount || 0;
      totals[bucketKey].onTimeCount += activityBuckets[bucketKey].onTimeCount || 0;
    });
  });
  return totals;
}

function pickBestBucket(bucketMap) {
  let best = null;
  Object.keys(bucketMap || {}).forEach((bucketKey) => {
    const bucket = bucketMap[bucketKey];
    if (!bucket) return;
    const completionCount = bucket.completionCount || 0;
    const onTimeCount = bucket.onTimeCount || 0;
    if (completionCount < MIN_BUCKET_COMPLETIONS || onTimeCount === 0) return;
    const rate = onTimeCount / completionCount;
    if (!best || rate > best.rate || (rate === best.rate && completionCount > best.completionCount)) {
      best = { bucketKey, rate, completionCount };
    }
  });
  return best;
}

function buildInsights(metrics) {
  const insights = [];
  if (!metrics?.buckets) return insights;

  const globalBuckets = aggregateBuckets(metrics.buckets);
  const globalBest = pickBestBucket(globalBuckets);
  if (globalBest) {
    insights.push({
      score: globalBest.rate,
      text: `Across all activities, on-time completions are most common between ${formatBucket(globalBest.bucketKey)}.`,
    });
  }

  const activityEntries = Object.keys(metrics.buckets)
    .map((activityKey) => {
    const best = pickBestBucket(metrics.buckets[activityKey]);
    if (!best) return null;
    return {
      activityKey,
      bucketKey: best.bucketKey,
      rate: best.rate,
      completionCount: best.completionCount,
    };
    })
    .filter(Boolean);

  activityEntries.sort((a, b) => b.rate - a.rate || b.completionCount - a.completionCount);

  activityEntries.forEach((entry) => {
    if (insights.length >= MAX_INSIGHTS) return;
    const label = describeActivity(entry.activityKey);
    insights.push({
      score: entry.rate,
      text: `${label} tasks are most often completed on time between ${formatBucket(entry.bucketKey)}.`,
    });
  });

  return insights.slice(0, MAX_INSIGHTS);
}

function renderInsights() {
  const panel = document.getElementById("insights-panel");
  const list = document.getElementById("insights-list");
  if (!panel || !list) return;

  const tasks = readTasksFromStorage();
  if (tasks.length < MIN_TASKS) {
    panel.classList.add("hidden");
    list.innerHTML = "";
    return;
  }

  panel.classList.remove("hidden");
  const metrics = readActivityMetrics() || recomputeActivityMetrics(tasks);
  const insights = buildInsights(metrics);

  list.innerHTML = "";
  if (!insights.length) {
    const empty = document.createElement("li");
    empty.className = "insights-empty";
    empty.textContent = "Not enough completion data yet.";
    list.appendChild(empty);
    return;
  }

  insights.forEach((insight) => {
    const li = document.createElement("li");
    li.className = "insights-item";
    li.textContent = insight.text;
    list.appendChild(li);
  });
}

function initReflectiveInsights() {
  renderInsights();
  window.addEventListener("kanba:tasks-updated", renderInsights);
  window.addEventListener("kanba:tasks-rendered", renderInsights);
}

export { initReflectiveInsights };
