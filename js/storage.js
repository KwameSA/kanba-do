import { containers } from "./constants.js";
import { updateNotifications } from "./tasks.js";

function saveTask() {
  const allTasks = [...containers.do.children, ...containers.doing.children, ...containers.done.children];

  const tasks = allTasks.map((li) => ({
    text: li.querySelector(".task-text").textContent.trim(),
    description: li.dataset.description || "",
    priority: li.dataset.priority || "low",
    duedate: li.dataset.duedate || "",
    checked: li.dataset.checked === "true",
    dateAdded: li.dataset.dateAdded || new Date().toISOString(),
    status: li.dataset.status,
    tags: li.dataset.tags || "",
    completedAt: li.dataset.completedAt || null,
  }));

  localStorage.setItem("kanbaTasks", JSON.stringify(tasks));
  updateNotifications();
}

function saveDailySnapshot() {
  const today = new Date().toISOString().split("T")[0];
  const existing = JSON.parse(localStorage.getItem("kanbaTrends")) || [];

  if (existing.some((entry) => entry.date === today)) return;

  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];

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
