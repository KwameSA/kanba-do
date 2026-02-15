import { readTasksFromStorage } from "./task-model.js";
import { readActivityMetrics, recomputeActivityMetrics } from "./activity-metrics.js";

const MIN_TASKS = 5;
const MIN_BUCKET_COMPLETIONS = 2;
const EXPERIMENT_DIFF = 0.25;
const STRONG_DIFF = 0.3;
const FRICTION_MIN = 3;
const MAX_SUGGESTIONS = 3;

function titleCase(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function describeActivity(activityKey) {
  if (activityKey === "unspecified") return "Uncategorized";
  return titleCase(activityKey);
}

function formatBucket(bucketKey) {
  return bucketKey;
}

function getBucketStats(activityBuckets) {
  return Object.keys(activityBuckets || {})
    .map((bucketKey) => {
      const bucket = activityBuckets[bucketKey];
      if (!bucket) return null;
      const completionCount = bucket.completionCount || 0;
      if (completionCount < MIN_BUCKET_COMPLETIONS) return null;
      const onTimeCount = bucket.onTimeCount || 0;
      const rate = onTimeCount / completionCount;
      return { bucketKey, completionCount, onTimeCount, rate, rescheduleCount: bucket.rescheduleCount || 0 };
    })
    .filter(Boolean);
}

function findPatternSuggestion(activityKey, bucketStats) {
  if (bucketStats.length < 2) return null;
  const sorted = [...bucketStats].sort((a, b) => b.rate - a.rate || b.completionCount - a.completionCount);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  const diff = best.rate - worst.rate;
  if (diff < EXPERIMENT_DIFF) return null;

  const diffPct = Math.round(diff * 100);
  const label = describeActivity(activityKey);
  const bestBucket = formatBucket(best.bucketKey);
  const worstBucket = formatBucket(worst.bucketKey);

  if (diff >= STRONG_DIFF) {
    return {
      tone: "strong",
      score: diff,
      text: `${label} tasks are ${diffPct}% more on time between ${bestBucket} than ${worstBucket}. If you want, we can prioritize that window.`,
      activityKey,
    };
  }

  return {
    tone: "experiment",
    score: diff,
    text: `Want to try ${label} tasks between ${bestBucket}? They land on time about ${diffPct}% more often than ${worstBucket}.`,
    activityKey,
  };
}

function findFrictionSuggestion(activityKey, bucketStats) {
  const totalReschedules = bucketStats.reduce((sum, bucket) => sum + (bucket.rescheduleCount || 0), 0);
  if (totalReschedules < FRICTION_MIN) return null;
  const best = [...bucketStats].sort((a, b) => b.rate - a.rate || b.completionCount - a.completionCount)[0];
  const label = describeActivity(activityKey);
  if (best) {
    return {
      tone: "experiment",
      score: totalReschedules,
      text: `${label} tasks were rescheduled ${totalReschedules} times. Want to try them between ${formatBucket(best.bucketKey)} next time?`,
      activityKey,
    };
  }
  return {
    tone: "experiment",
    score: totalReschedules,
    text: `${label} tasks were rescheduled ${totalReschedules} times. Want to try a different time window next time?`,
    activityKey,
  };
}

function buildSuggestions(metrics) {
  const suggestions = [];
  if (!metrics?.buckets) return suggestions;

  const activityKeys = Object.keys(metrics.buckets);
  activityKeys.forEach((activityKey) => {
    const stats = getBucketStats(metrics.buckets[activityKey]);
    if (!stats.length) return;
    const pattern = findPatternSuggestion(activityKey, stats);
    if (pattern) suggestions.push(pattern);
  });

  const strong = suggestions.filter((s) => s.tone === "strong").sort((a, b) => b.score - a.score);
  const experiment = suggestions.filter((s) => s.tone === "experiment").sort((a, b) => b.score - a.score);

  const ordered = [...strong, ...experiment];
  const usedActivities = new Set(ordered.map((s) => s.activityKey));

  activityKeys.forEach((activityKey) => {
    if (ordered.length >= MAX_SUGGESTIONS) return;
    if (usedActivities.has(activityKey)) return;
    const stats = getBucketStats(metrics.buckets[activityKey]);
    if (!stats.length) return;
    const friction = findFrictionSuggestion(activityKey, stats);
    if (friction) {
      ordered.push(friction);
      usedActivities.add(activityKey);
    }
  });

  return ordered.slice(0, MAX_SUGGESTIONS);
}

function renderSuggestions() {
  const panel = document.getElementById("suggestions-panel");
  const list = document.getElementById("suggestions-list");
  if (!panel || !list) return;

  const tasks = readTasksFromStorage();
  if (tasks.length < MIN_TASKS) {
    panel.classList.add("hidden");
    list.innerHTML = "";
    return;
  }

  const metrics = readActivityMetrics() || recomputeActivityMetrics(tasks);
  const suggestions = buildSuggestions(metrics);

  if (!suggestions.length) {
    panel.classList.add("hidden");
    list.innerHTML = "";
    return;
  }

  panel.classList.remove("hidden");
  list.innerHTML = "";
  suggestions.forEach((suggestion) => {
    const li = document.createElement("li");
    li.className = "suggestions-item";
    li.textContent = suggestion.text;
    list.appendChild(li);
  });
}

function initSuggestionRules() {
  renderSuggestions();
  window.addEventListener("kanba:tasks-updated", renderSuggestions);
  window.addEventListener("kanba:tasks-rendered", renderSuggestions);
}

export { initSuggestionRules };
