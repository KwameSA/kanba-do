import { initCommon } from "./page-common.js";
import { readTasksFromStorage } from "./task-model.js";

function getDueStatus(task) {
  if (!task.duedate) return "none";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(task.duedate);
  due.setHours(0, 0, 0, 0);

  if (due < today) return "overdue";

  const diffInDays = (due - today) / (1000 * 60 * 60 * 24);
  if (diffInDays >= 0 && diffInDays < 2) return "due-soon";

  return "ok";
}

function renderNotifications() {
  const overdueList = document.getElementById("overdue-list");
  const duesoonList = document.getElementById("duesoon-list");
  const noOverdueMsg = document.getElementById("no-overdue-msg");
  const noDueSoonMsg = document.getElementById("no-duesoon-msg");

  const tasks = readTasksFromStorage();
  const activeTasks = tasks.filter((task) => task.status !== "done");

  const overdueTasks = activeTasks.filter((task) => getDueStatus(task) === "overdue");
  const duesoonTasks = activeTasks.filter((task) => getDueStatus(task) === "due-soon");

  overdueList.innerHTML = "";
  duesoonList.innerHTML = "";

  if (overdueTasks.length === 0) {
    noOverdueMsg.style.display = "block";
  } else {
    noOverdueMsg.style.display = "none";
    overdueTasks.forEach((task) => {
      const li = document.createElement("li");
      li.textContent = `${task.text} - due ${task.duedate || "unknown"}`;
      overdueList.appendChild(li);
    });
  }

  if (duesoonTasks.length === 0) {
    noDueSoonMsg.style.display = "block";
  } else {
    noDueSoonMsg.style.display = "none";
    duesoonTasks.forEach((task) => {
      const li = document.createElement("li");
      li.textContent = `${task.text} - due ${task.duedate || "unknown"}`;
      duesoonList.appendChild(li);
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initCommon();
  renderNotifications();
});
