import { elements } from "./constants.js";
import { showTask, updateNotifications } from "./tasks.js";
import { renderWarnings } from "./analytics.js";
import { exportTasksToCSV } from "./export.js";
import { saveDailySnapshot } from "./storage.js";

// SIMULATION FUNCTIONS

function simulateFakeTrendData() {
  const fakeTrends = [];

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 6);

  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    fakeTrends.push({
      date: dateStr,
      do: Math.max(0, 7 - i),
      doing: i % 3,
      done: i,
    });
  }

  localStorage.setItem("kanbaTrends", JSON.stringify(fakeTrends));
}

function simulateFakeTasksWithTags() {
  const fakeTasks = [];

  const tagPool = ["school", "urgent", "project", "fitness", "fun", "deepwork", "health", "family", "read", "longterm"];

  for (let i = 0; i < 20; i++) {
    const tagCount = Math.floor(Math.random() * 2) + 1;
    const tags = [];

    while (tags.length < tagCount) {
      const tag = tagPool[Math.floor(Math.random() * tagPool.length)];
      if (!tags.includes(tag)) tags.push(tag);
    }

    fakeTasks.push({
      text: `Fake Task ${i + 1}`,
      description: "Auto-generated",
      priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
      duedate: "",
      checked: false,
      dateAdded: new Date().toISOString(),
      status: ["do", "doing", "done"][Math.floor(Math.random() * 3)],
      tags: tags.join(","),
    });
  }

  localStorage.setItem("kanbaTasks", JSON.stringify(fakeTasks));
}

function simulateInsightsData() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];

  const updatedTasks = tasks.map((task, i) => {
    if (task.status === "done") {
      const base = new Date();
      base.setDate(base.getDate() - (i % 5));

      const daysTaken = Math.floor(Math.random() * 4) + 1;
      const added = new Date(base);
      const completed = new Date(base);
      completed.setDate(base.getDate() + daysTaken);

      return {
        ...task,
        dateAdded: added.toISOString(),
        completedAt: completed.toISOString(),
      };
    }
    return task;
  });

  localStorage.setItem("kanbaTasks", JSON.stringify(updatedTasks));
}

function simulateWarningsData() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];

  const today = new Date();
  const stagnantDate = new Date(today);
  stagnantDate.setDate(today.getDate() - 5);

  for (let i = 0; i < 4; i++) {
    tasks.push({
      text: `Stagnant Task ${i + 1}`,
      description: "Hasn't moved",
      priority: "medium",
      duedate: "",
      checked: false,
      dateAdded: stagnantDate.toISOString(),
      status: i % 2 === 0 ? "do" : "doing",
      tags: "stuck",
    });
  }

  for (let i = 0; i < 6; i++) {
    tasks.push({
      text: `Overload Task ${i + 1}`,
      description: "Too many of this tag",
      priority: "high",
      duedate: "",
      checked: false,
      dateAdded: today.toISOString(),
      status: "do",
      tags: "urgent",
    });
  }

  localStorage.setItem("kanbaTasks", JSON.stringify(tasks));
}

function simulatePriorityTrends() {
  const fakeTrends = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 6);

  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const low = Math.floor(Math.random() * 4);
    const medium = Math.floor(Math.random() * 4);
    const high = Math.floor(Math.random() * 4);

    fakeTrends.push({
      date: dateStr,
      do: Math.floor(Math.random() * 4),
      doing: Math.floor(Math.random() * 3),
      done: Math.floor(Math.random() * 5),
      low,
      medium,
      high,
    });
  }

  localStorage.setItem("kanbaTrends", JSON.stringify(fakeTrends));
}

function simulateTagCompletionData() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];

  const tagOptions = ["school", "fun", "project", "fitness", "urgent", "longterm"];
  const updated = tasks.map((task, i) => {
    if (task.status === "done") {
      const tag = tagOptions[i % tagOptions.length];
      return {
        ...task,
        tags: tag,
        completedAt: task.completedAt || new Date().toISOString(),
      };
    }
    return task;
  });

  localStorage.setItem("kanbaTasks", JSON.stringify(updated));
}

// Initialize toggle switch and simulation
export function initSimulationToggle() {
  if (localStorage.getItem("kanbaSimulated")) {
    simulateFakeTasksWithTags();
    simulateWarningsData();
    simulateFakeTrendData();
    simulateInsightsData();
    simulatePriorityTrends();
    simulateTagCompletionData();
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
      elements.simIcon.classList.remove("fa-toggle-on");
      elements.simIcon.classList.add("fa-toggle-off");

      showTask();
      renderWarnings();
      updateNotifications();
    } else {
      simulateFakeTasksWithTags();
      simulateWarningsData();
      simulateFakeTrendData();
      simulateInsightsData();
      simulatePriorityTrends();
      simulateTagCompletionData();

      localStorage.setItem("kanbaSimulated", "true");
      simIcon.classList.remove("fa-toggle-off");
      simIcon.classList.add("fa-toggle-on");

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
