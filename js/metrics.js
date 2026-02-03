import { getLatestStageEntry, getStageEntries } from "./task-model.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateKey(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseDateKey(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function diffDays(fromIso, toIso) {
  return (new Date(toIso) - new Date(fromIso)) / DAY_MS;
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getFirstDoneAt(task) {
  const doneEntries = getStageEntries(task, "DONE");
  return doneEntries[0]?.enteredAt || null;
}

function getLatestDoneAt(task) {
  const doneEntries = getStageEntries(task, "DONE");
  return doneEntries[doneEntries.length - 1]?.enteredAt || null;
}

function isOverdue(task, now = new Date()) {
  if (!task.duedate || task.status === "done") return false;
  return parseDateKey(task.duedate) < startOfDay(now);
}

function getStageAgeDays(task, now = new Date()) {
  const latest = getLatestStageEntry(task);
  const enteredAt = latest?.enteredAt || task.createdAt;
  return diffDays(enteredAt, now.toISOString());
}

function getDueRiskWeight(task, now = new Date()) {
  if (!task.duedate || task.status === "done") return 0;
  const due = parseDateKey(task.duedate);
  const today = startOfDay(now);
  const diff = (due - today) / DAY_MS;
  if (diff < 0) return 4;
  if (diff === 0) return 3;
  if (diff <= 2) return 2;
  if (diff <= 7) return 1;
  return 0;
}

function getPriorityWeight(priority) {
  return { high: 3, medium: 2, low: 1 }[priority] || 1;
}

function buildFocusList(tasks, now = new Date()) {
  return tasks
    .filter((task) => task.status !== "done")
    .map((task) => {
      const reasons = [];
      const priorityWeight = getPriorityWeight(task.priority);
      const dueRiskWeight = getDueRiskWeight(task, now);
      const stageAge = getStageAgeDays(task, now);
      const stagnationWeight = task.status === "doing" && stageAge >= 3 ? 2 : 0;

      if (task.priority) reasons.push(task.priority.toUpperCase());
      if (dueRiskWeight === 4) reasons.push("Overdue");
      if (dueRiskWeight === 3) reasons.push("Due today");
      if (dueRiskWeight === 2) reasons.push("Due in 2 days");
      if (stagnationWeight) reasons.push("Stagnant");

      return {
        task,
        score: priorityWeight + dueRiskWeight + stagnationWeight,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score || new Date(a.task.createdAt) - new Date(b.task.createdAt))
    .slice(0, 3);
}

function getWindowStart(now = new Date(), days = 7) {
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return start;
}

function isInWindow(isoDate, windowStart, now = new Date()) {
  if (!isoDate) return false;
  const value = new Date(isoDate);
  return value >= windowStart && value <= now;
}

function countDoneEntriesInWindow(task, windowStart, now = new Date()) {
  return getStageEntries(task, "DONE").filter((entry) => isInWindow(entry.enteredAt, windowStart, now)).length;
}

function computeOpsMetrics(tasks, now = new Date()) {
  const windowStart = getWindowStart(now, 7);
  const wip = tasks.filter((task) => task.status === "doing").length;
  const throughput7d = tasks.filter((task) => countDoneEntriesInWindow(task, windowStart, now) > 0).length;

  const completedTasks = tasks.filter((task) => getFirstDoneAt(task));
  const cycleSamples = completedTasks.map((task) => diffDays(task.createdAt, getFirstDoneAt(task)));
  const leadSamples = completedTasks
    .map((task) => {
      const firstDo = getStageEntries(task, "DO")[0]?.enteredAt;
      const firstDone = getFirstDoneAt(task);
      if (!firstDo || !firstDone) return null;
      return diffDays(firstDo, firstDone);
    })
    .filter((value) => value !== null);

  const stagnantDoing = tasks.filter((task) => task.status === "doing" && getStageAgeDays(task, now) >= 3).length;

  return {
    wip,
    throughput7d,
    avgCycleDays: cycleSamples.length ? average(cycleSamples) : null,
    avgLeadDays: leadSamples.length ? average(leadSamples) : null,
    stagnantDoing,
  };
}

function computeWeeklyReview(tasks, now = new Date()) {
  const windowStart = getWindowStart(now, 7);
  const completedThisWeekTasks = tasks.filter((task) => countDoneEntriesInWindow(task, windowStart, now) > 0);
  const completedThisWeek = completedThisWeekTasks.length;
  const createdThisWeek = tasks.filter((task) => isInWindow(task.createdAt, windowStart, now)).length;
  const overdueCount = tasks.filter((task) => isOverdue(task, now)).length;

  const cycleThisWeek = completedThisWeekTasks
    .map((task) => {
      const doneAt = getLatestDoneAt(task);
      if (!doneAt || !isInWindow(doneAt, windowStart, now)) return null;
      return diffDays(task.createdAt, doneAt);
    })
    .filter((value) => value !== null);

  const touchedThisWeek = tasks.filter((task) => isInWindow(task.updatedAt, windowStart, now) || countDoneEntriesInWindow(task, windowStart, now) > 0);
  const tagCounts = {};
  touchedThisWeek.forEach((task) => {
    (task.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
  });

  const topTag = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a])[0] || null;
  const stagnantDoingTasks = tasks.filter((task) => task.status === "doing" && getStageAgeDays(task, now) >= 3);
  const stagnantTagCounts = {};
  stagnantDoingTasks.forEach((task) => {
    (task.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => {
        stagnantTagCounts[tag] = (stagnantTagCounts[tag] || 0) + 1;
      });
  });
  const topStagnantTag = Object.keys(stagnantTagCounts).sort((a, b) => stagnantTagCounts[b] - stagnantTagCounts[a])[0];

  return {
    windowStart: windowStart.toISOString(),
    windowEnd: now.toISOString(),
    definition: "Top tag is based on tasks updated or completed in the last 7 days.",
    completedThisWeek,
    createdThisWeek,
    overdueCount,
    avgCycleCompletedThisWeek: cycleThisWeek.length ? average(cycleThisWeek) : null,
    topTagOfWeek: topTag,
    bottleneck: topStagnantTag ? `Most stagnant tasks tagged: #${topStagnantTag}` : "No stagnant DOING cluster this week.",
  };
}

function countTasksDueOnDate(tasks, dateKey, includeDone = true) {
  return tasks.filter((task) => task.duedate === dateKey && (includeDone || task.status !== "done")).length;
}

export { buildFocusList, computeOpsMetrics, computeWeeklyReview, countTasksDueOnDate, parseDateKey, startOfDay, toDateKey };
