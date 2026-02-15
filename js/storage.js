import { containers } from "./constants.js";
import { updateNotifications } from "./tasks.js";
import { migrateTasks, writeTasksToStorage } from "./task-model.js";

function saveTask() {
  const allTasks = [...containers.do.children, ...containers.doing.children, ...containers.done.children];

  const tasks = allTasks.map((li) => {
    let stageHistory = [];
    try {
      stageHistory = JSON.parse(li.dataset.stageHistory || "[]");
    } catch {
      stageHistory = [];
    }
    let recurrence = null;
    try {
      recurrence = JSON.parse(li.dataset.recurrence || "null");
    } catch {
      recurrence = null;
    }

    return {
      id: li.dataset.taskId,
      text: li.querySelector(".task-text").textContent.trim(),
      description: li.dataset.description || "",
      priority: li.dataset.priority || "low",
      duedate: li.dataset.duedate || "",
      checked: li.dataset.checked === "true",
      dateAdded: li.dataset.dateAdded || li.dataset.createdAt || new Date().toISOString(),
      status: li.dataset.status,
      tags: li.dataset.tags || "",
      activityType: li.dataset.activityType || "",
      recurrence,
      completedAt: li.dataset.completedAt || null,
      createdAt: li.dataset.createdAt,
      updatedAt: li.dataset.updatedAt,
      lastMovedAt: li.dataset.lastMovedAt,
      stageHistory,
    };
  });

  const normalized = writeTasksToStorage(tasks);
  updateNotifications();
  window.dispatchEvent(new CustomEvent("kanba:tasks-updated"));
  return normalized;
}

function saveDailySnapshot() {
  const today = new Date().toISOString().split("T")[0];
  const existing = JSON.parse(localStorage.getItem("kanbaTrends")) || [];

  if (existing.some((entry) => entry.date === today)) return;

  const tasks = migrateTasks(JSON.parse(localStorage.getItem("kanbaTasks")) || []);

  const snapshot = {
    date: today,
    do: tasks.filter((t) => t.status === "do").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
    low: tasks.filter((t) => t.priority === "low").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    high: tasks.filter((t) => t.priority === "high").length,
  };

  localStorage.setItem("kanbaTrends", JSON.stringify([...existing, snapshot]));
}

export { saveTask, saveDailySnapshot };
