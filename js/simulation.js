import { elements } from "./constants.js";
import { showTask, updateNotifications } from "./tasks.js";
import { renderWarnings } from "./analytics.js";
import { exportTasksToCSV } from "./export.js";
import { saveDailySnapshot } from "./storage.js";

// SIMULATION FUNCTIONS (Meaningful, deterministic dataset)
const SIM_DATASET_VERSION = "2026-02-07-analyst-life-v1";

function toDateKey(date) {
  return date.toISOString().split("T")[0];
}

function makeDate(base, offsetDays, hour, minute) {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function buildStageHistory(createdAt, completedAt, reschedules = 0) {
  const history = [];
  const start = new Date(createdAt);
  history.push({ stage: "DO", enteredAt: start.toISOString() });

  let cursor = new Date(start);
  cursor.setHours(cursor.getHours() + 2);
  history.push({ stage: "DOING", enteredAt: cursor.toISOString() });

  for (let i = 0; i < reschedules; i += 1) {
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() + 1);
    history.push({ stage: "DO", enteredAt: cursor.toISOString() });
    cursor.setHours(cursor.getHours() + 2);
    history.push({ stage: "DOING", enteredAt: cursor.toISOString() });
  }

  history.push({ stage: "DONE", enteredAt: completedAt.toISOString() });
  return history;
}

function buildSimulatedTasks(seed = new Date()) {
  const tasks = [];
  let id = 1;

  const makeDoneTask = ({
    text,
    activityType,
    tags,
    completedAt,
    createdAt,
    duedate,
    priority = "medium",
    description = "",
    reschedules = 0,
  }) => ({
    id: `sim-${id++}`,
    text,
    description,
    priority,
    duedate,
    checked: true,
    dateAdded: createdAt.toISOString(),
    status: "done",
    tags,
    activityType,
    completedAt: completedAt.toISOString(),
    createdAt: createdAt.toISOString(),
    updatedAt: completedAt.toISOString(),
    lastMovedAt: completedAt.toISOString(),
    stageHistory: buildStageHistory(createdAt, completedAt, reschedules),
  });

  const makeDoTask = ({
    text,
    activityType,
    tags,
    createdAt,
    duedate,
    priority = "low",
    description = "",
    recurrence = null,
  }) => ({
    id: `sim-${id++}`,
    text,
    description,
    priority,
    duedate,
    checked: false,
    dateAdded: createdAt.toISOString(),
    status: "do",
    tags,
    activityType,
    completedAt: null,
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
    lastMovedAt: createdAt.toISOString(),
    recurrence,
    stageHistory: [{ stage: "DO", enteredAt: createdAt.toISOString() }],
  });

  const makeDoingTask = ({
    text,
    activityType,
    tags,
    createdAt,
    lastMovedAt,
    duedate,
    priority = "medium",
    description = "",
  }) => ({
    id: `sim-${id++}`,
    text,
    description,
    priority,
    duedate,
    checked: false,
    dateAdded: createdAt.toISOString(),
    status: "doing",
    tags,
    activityType,
    completedAt: null,
    createdAt: createdAt.toISOString(),
    updatedAt: lastMovedAt.toISOString(),
    lastMovedAt: lastMovedAt.toISOString(),
    stageHistory: [
      { stage: "DO", enteredAt: createdAt.toISOString() },
      { stage: "DOING", enteredAt: lastMovedAt.toISOString() },
    ],
  });

  // FITNESS (consistent completed sessions)
  const strengthDays = [1, 3, 6, 8, 11, 14];
  strengthDays.forEach((daysAgo, idx) => {
    const completedAt = makeDate(seed, -daysAgo, 7, 10 + idx);
    const createdAt = makeDate(seed, -daysAgo - 1, 6, 15);
    tasks.push(
      makeDoneTask({
        text: idx % 2 === 0 ? "Strength training (upper body)" : "Strength training (lower body)",
        activityType: "Fitness",
        tags: "fitness,strength,morning",
        completedAt,
        createdAt,
        duedate: toDateKey(completedAt),
        priority: "medium",
        description: "Completed before deep work block.",
      })
    );
  });

  const cardioDays = [2, 5, 9, 12];
  cardioDays.forEach((daysAgo, idx) => {
    const completedAt = makeDate(seed, -daysAgo, 19, 0 + idx);
    const createdAt = makeDate(seed, -daysAgo - 2, 17, 30);
    const dueDate = makeDate(seed, -daysAgo - 1, 20, 0);
    tasks.push(
      makeDoneTask({
        text: idx % 2 === 0 ? "Zone 2 treadmill run" : "Tempo outdoor run",
        activityType: "Fitness",
        tags: "fitness,cardio,evening",
        completedAt,
        createdAt,
        duedate: toDateKey(dueDate),
        priority: "medium",
        description: "Focused on consistency over pace.",
      })
    );
  });

  // SYSTEMS ANALYST DEEP WORK
  const analystDeepWorkDays = [1, 4, 7, 10, 13, 15];
  analystDeepWorkDays.forEach((daysAgo, idx) => {
    const completedAt = makeDate(seed, -daysAgo, 11, 20);
    const createdAt = makeDate(seed, -daysAgo - 1, 8, 45);
    const dueDate = idx < 4 ? toDateKey(completedAt) : toDateKey(makeDate(seed, -daysAgo - 1, 17, 30));
    const deepWorkTitles = [
      "Map sales-to-fulfillment process bottlenecks",
      "Draft stakeholder requirements for analytics dashboard",
      "Validate API-to-report data lineage",
      "Define escalation flow for delayed tickets",
      "Review UAT defects and root-cause notes",
      "Write weekly systems performance summary",
    ];
    tasks.push(
      makeDoneTask({
        text: deepWorkTitles[idx],
        activityType: "Deep Work",
        tags: "systems,analysis,deepwork",
        completedAt,
        createdAt,
        duedate: dueDate,
        priority: "high",
        description: "Focused analysis session with clear deliverable.",
      })
    );
  });

  // ADMIN / COORDINATION (some reschedules to keep warnings meaningful)
  const adminDays = [3, 6, 9, 12];
  adminDays.forEach((daysAgo, idx) => {
    const completedAt = makeDate(seed, -daysAgo, 15, 10);
    const createdAt = makeDate(seed, -daysAgo - 4, 9, 20);
    const adminTitles = [
      "Send meeting notes and action owners",
      "Clean up backlog statuses before standup",
      "Prepare leadership update slides",
      "Close resolved incident follow-ups",
    ];
    tasks.push(
      makeDoneTask({
        text: adminTitles[idx],
        activityType: "Admin",
        tags: "admin,systems,urgent",
        completedAt,
        createdAt,
        duedate: idx === 1 ? toDateKey(makeDate(seed, -daysAgo - 1, 18, 0)) : toDateKey(completedAt),
        priority: "high",
        reschedules: idx < 2 ? 1 : 0,
        description: "Coordination task completed after dependencies cleared.",
      })
    );
  });

  // LEARNING + MUSIC
  const learningDays = [5, 11];
  learningDays.forEach((daysAgo) => {
    const completedAt = makeDate(seed, -daysAgo, 20, 25);
    const createdAt = makeDate(seed, -daysAgo - 2, 19, 10);
    tasks.push(
      makeDoneTask({
        text: "Study one systems design case",
        activityType: "Learning",
        tags: "learning,systems",
        completedAt,
        createdAt,
        duedate: toDateKey(completedAt),
        priority: "medium",
        description: "Captured 3 architecture takeaways.",
      })
    );
  });

  const musicDays = [4, 8, 13];
  musicDays.forEach((daysAgo, idx) => {
    const completedAt = makeDate(seed, -daysAgo, 21, 0);
    const createdAt = makeDate(seed, -daysAgo - 1, 18, 30);
    const musicTitles = [
      "Curate focus playlist for deep analysis",
      "Practice guitar for 30 minutes",
      "Update training playlist and save favorites",
    ];
    tasks.push(
      makeDoneTask({
        text: musicTitles[idx],
        activityType: "Creative",
        tags: "music,creative,recovery",
        completedAt,
        createdAt,
        duedate: toDateKey(completedAt),
        priority: "low",
        description: "Music block used for mental reset.",
      })
    );
  });

  // ACTIVE TASKS (purposefully realistic to drive insights/warnings)
  tasks.push(
    makeDoTask({
      text: "Finalize weekly KPI variance report",
      activityType: "Admin",
      tags: "systems,urgent,reporting",
      createdAt: makeDate(seed, -6, 8, 30),
      duedate: toDateKey(makeDate(seed, -1, 17, 0)),
      priority: "high",
      description: "Due date passed; needs final commentary and distribution list.",
    })
  );

  tasks.push(
    makeDoingTask({
      text: "Investigate recurring ETL latency alerts",
      activityType: "Deep Work",
      tags: "systems,analysis,urgent",
      createdAt: makeDate(seed, -10, 9, 0),
      lastMovedAt: makeDate(seed, -4, 10, 15),
      duedate: toDateKey(makeDate(seed, 1, 12, 0)),
      priority: "high",
      description: "Tracing late-stage transform job and upstream dependencies.",
    })
  );

  tasks.push(
    makeDoingTask({
      text: "Plan next week training split + run schedule",
      activityType: "Fitness",
      tags: "fitness,planning,health",
      createdAt: makeDate(seed, -7, 7, 0),
      lastMovedAt: makeDate(seed, -3, 7, 20),
      duedate: toDateKey(makeDate(seed, 0, 8, 0)),
      priority: "medium",
      description: "Align sessions with heavier workdays.",
    })
  );

  tasks.push(
    makeDoTask({
      text: "Prepare Monday stakeholder sync agenda",
      activityType: "Admin",
      tags: "systems,meeting",
      createdAt: makeDate(seed, -2, 14, 30),
      duedate: toDateKey(makeDate(seed, 1, 9, 0)),
      priority: "medium",
      description: "List blockers, decisions needed, and owner updates.",
    })
  );

  tasks.push(
    makeDoTask({
      text: "Refine dashboard requirement notes from last review",
      activityType: "Deep Work",
      tags: "analysis,requirements",
      createdAt: makeDate(seed, -1, 16, 40),
      duedate: toDateKey(makeDate(seed, 2, 11, 0)),
      priority: "medium",
    })
  );

  tasks.push(
    makeDoTask({
      text: "Build fresh gym + deep-focus playlist",
      activityType: "Creative",
      tags: "music,fitness,focus",
      createdAt: makeDate(seed, -1, 19, 0),
      duedate: toDateKey(makeDate(seed, 3, 20, 0)),
      priority: "low",
    })
  );

  tasks.push(
    makeDoTask({
      text: "Mobility routine (15 min)",
      activityType: "Fitness",
      tags: "fitness,recovery",
      createdAt: makeDate(seed, -1, 6, 20),
      duedate: toDateKey(makeDate(seed, 0, 6, 45)),
      priority: "low",
      recurrence: { type: "daily" },
    })
  );

  tasks.push(
    makeDoTask({
      text: "Inbox zero before Friday close",
      activityType: "Admin",
      tags: "admin,routine",
      createdAt: makeDate(seed, -3, 8, 40),
      duedate: toDateKey(makeDate(seed, 4, 16, 0)),
      priority: "low",
    })
  );

  return tasks;
}

function buildTrendData(seed = new Date()) {
  const trends = [];
  const baseDate = new Date(seed);
  baseDate.setDate(baseDate.getDate() - 27);

  for (let i = 0; i < 28; i += 1) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    const dateStr = toDateKey(date);

    const doCount = Math.max(4, 18 - Math.floor(i / 2));
    const doingCount = 4 + (i % 3);
    const doneCount = Math.max(0, i - 3);
    const low = Math.max(2, 6 - Math.floor(i / 6));
    const medium = 3 + (i % 4);
    const high = 2 + (i % 2);

    trends.push({
      date: dateStr,
      do: doCount,
      doing: doingCount,
      done: doneCount,
      low,
      medium,
      high,
    });
  }

  return trends;
}

function applySimulatedDataset() {
  const seed = new Date();
  const tasks = buildSimulatedTasks(seed);
  const trends = buildTrendData(seed);
  localStorage.setItem("kanbaTasks", JSON.stringify(tasks));
  localStorage.setItem("kanbaTrends", JSON.stringify(trends));
  localStorage.setItem("kanbaSimVersion", SIM_DATASET_VERSION);
}

function simulateFakeTrendData() {
  applySimulatedDataset();
}

function simulateFakeTasksWithTags() {
  applySimulatedDataset();
}

function simulateInsightsData() {
  applySimulatedDataset();
}

function simulateWarningsData() {
  applySimulatedDataset();
}

function simulatePriorityTrends() {
  applySimulatedDataset();
}

function simulateTagCompletionData() {
  applySimulatedDataset();
}

export function ensureSimulatedDatasetCurrent() {
  if (!localStorage.getItem("kanbaSimulated")) return;
  const currentVersion = localStorage.getItem("kanbaSimVersion");
  if (currentVersion !== SIM_DATASET_VERSION) {
    applySimulatedDataset();
  }
}

// Initialize toggle switch and simulation
export function initSimulationToggle() {
  if (localStorage.getItem("kanbaSimulated")) {
    applySimulatedDataset();
    elements.simIcon.classList.remove("fa-toggle-off");
    elements.simIcon.classList.add("fa-toggle-on");
  } else {
    elements.simIcon.classList.remove("fa-toggle-on");
    elements.simIcon.classList.add("fa-toggle-off");
  }

  elements.simToggle.addEventListener("click", () => {
    const isSimOn = localStorage.getItem("kanbaSimulated");

    if (isSimOn) {
      localStorage.removeItem("kanbaSimulated");
      localStorage.removeItem("kanbaTasks");
      localStorage.removeItem("kanbaTrends");
      localStorage.removeItem("kanbaSimVersion");
      elements.simIcon.classList.remove("fa-toggle-on");
      elements.simIcon.classList.add("fa-toggle-off");

      showTask();
      renderWarnings();
      updateNotifications();
    } else {
      applySimulatedDataset();

      localStorage.setItem("kanbaSimulated", "true");
      elements.simIcon.classList.remove("fa-toggle-off");
      elements.simIcon.classList.add("fa-toggle-on");

      showTask();
      renderWarnings();
      updateNotifications();
    }
  });

  saveDailySnapshot();
  document.getElementById("export-csv-btn").addEventListener("click", exportTasksToCSV);
}

// Optional: export simulation functions for testing/debugging
export { simulateFakeTasksWithTags, simulateWarningsData, simulateFakeTrendData, simulateInsightsData, simulatePriorityTrends, simulateTagCompletionData };
