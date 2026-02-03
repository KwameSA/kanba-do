import { containers, elements } from "./constants.js";
import { saveTask } from "./storage.js";
import { updateTagFilterUI } from "./filters.js";
import { stringToColor, showError, getRandomMessage } from "./utils.js";
import { renderWarnings } from "./analytics.js";
import { setCurrentTaskElement } from "./modals.js";
import { appendStageHistory, nowIso, readTasksFromStorage, statusToStage } from "./task-model.js";

function getStageHistoryFromElement(li) {
  try {
    const parsed = JSON.parse(li.dataset.stageHistory || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStageHistoryOnElement(li, history) {
  li.dataset.stageHistory = JSON.stringify(history);
}

function touchTaskElement(li, nextStatus = null) {
  const timestamp = nowIso();
  li.dataset.updatedAt = timestamp;
  if (!nextStatus) return;

  const currentTask = {
    status: li.dataset.status,
    stageHistory: getStageHistoryFromElement(li),
    createdAt: li.dataset.createdAt,
    updatedAt: li.dataset.updatedAt,
  };
  const updated = appendStageHistory(currentTask, nextStatus, timestamp);
  setStageHistoryOnElement(li, updated.stageHistory);
}

function applyStatusVisuals(li, status) {
  const deleteBtn = li.querySelector(".delete");
  const moveBackBtn = li.querySelector(".move");
  const isDone = status === "done";

  li.dataset.status = status;
  li.dataset.checked = isDone ? "true" : "false";
  li.classList.toggle("checked", isDone);

  if (deleteBtn) deleteBtn.style.display = status === "do" ? "inline" : "none";
  if (moveBackBtn) moveBackBtn.style.display = status === "doing" ? "inline" : "none";
}

function requestTagFilter(tag) {
  const activeTag = document.body.dataset.activeTagFilter || "";
  const next = activeTag === tag ? null : tag;
  document.dispatchEvent(new CustomEvent("kanba:set-tag-filter", { detail: { tag: next } }));
  updateTagFilterUI(next);
}

export function createTaskElement(
  text,
  status,
  priority = "low",
  description = "",
  duedate = "",
  checked = false,
  dateAdded = nowIso(),
  tags = "",
  meta = {}
) {
  const taskNode = elements.taskTemplate.content.cloneNode(true);
  const li = taskNode.querySelector("li");
  setCurrentTaskElement(li);

  const taskText = li.querySelector(".task-text");
  const dot = li.querySelector(".priority-indicator");
  const deleteBtn = li.querySelector(".delete");
  const moveBtn = li.querySelector(".move");
  const checkBtn = li.querySelector(".checkbox-icon");
  const tagContainer = li.querySelector(".task-tags");
  const createdAt = meta.createdAt || dateAdded || nowIso();
  const updatedAt = meta.updatedAt || createdAt;
  const stageHistory =
    Array.isArray(meta.stageHistory) && meta.stageHistory.length
      ? meta.stageHistory
      : [{ stage: statusToStage(status), enteredAt: createdAt }];

  taskText.textContent = text;
  dot.classList.remove("priority-low", "priority-medium", "priority-high");
  dot.classList.add(`priority-${priority}`);

  li.dataset.taskId = meta.id || `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  li.dataset.priority = priority;
  li.dataset.description = description;
  li.dataset.duedate = duedate;
  li.dataset.checked = checked ? "true" : "false";
  li.dataset.dateAdded = dateAdded || createdAt;
  li.dataset.tags = tags;
  li.dataset.completedAt = meta.completedAt || "";
  li.dataset.createdAt = createdAt;
  li.dataset.updatedAt = updatedAt;
  setStageHistoryOnElement(li, stageHistory);
  applyStatusVisuals(li, status);
  li.id = `task-node-${li.dataset.taskId}`;
  li.draggable = true;
  li.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", li.id);
  });

  deleteBtn.onclick = () => {
    li.remove();
    saveTask();
  };

  moveBtn.onclick = () => moveTaskBackward(li);

  checkBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const currentStatus = li.dataset.status;
    if (currentStatus === "do" || currentStatus === "doing") {
      moveTaskForward(li);
    } else {
      moveTaskBackward(li);
    }
  });

  li.addEventListener("click", (e) => {
    if (e.target.closest(".delete, .move, .move-btn")) return;
    setCurrentTaskElement(li);
    elements.modalTaskName.value = taskText.textContent.trim();
    elements.modalTaskPriority.value = li.dataset.priority || "low";
    elements.modalTaskDescription.value = li.dataset.description || "";
    elements.modalTaskDueDate.value = li.dataset.duedate || "";
    elements.modalTaskTags.value = li.dataset.tags || "";
    elements.taskModal.style.display = "flex";
  });

  tagContainer.innerHTML = "";
  if (tags && tags.trim().length > 0) {
    tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => {
        const tagBubble = document.createElement("span");
        tagBubble.classList.add("tag-bubble");
        tagBubble.textContent = `#${tag}`;
        tagBubble.style.backgroundColor = stringToColor(tag);
        tagBubble.addEventListener("click", (e) => {
          e.stopPropagation();
          requestTagFilter(tag);
        });
        tagContainer.appendChild(tagBubble);
      });
  }

  updateDueStatus(li);
  updateNotifications();
  return li;
}

export function moveTaskToStatus(li, nextStatus) {
  const currentStatus = li.dataset.status;
  if (currentStatus === nextStatus) return;

  containers[nextStatus].appendChild(li);
  applyStatusVisuals(li, nextStatus);
  touchTaskElement(li, nextStatus);

  if (nextStatus === "done") {
    li.dataset.completedAt = nowIso();
  }

  updateDueStatus(li);
  checkCompletion();
  saveTask();
}

export function moveTaskForward(li) {
  const status = li.dataset.status;
  if (status === "do") moveTaskToStatus(li, "doing");
  if (status === "doing") moveTaskToStatus(li, "done");
}

export function moveTaskBackward(li) {
  const status = li.dataset.status;
  if (status === "done") moveTaskToStatus(li, "doing");
  if (status === "doing") moveTaskToStatus(li, "do");
}

export function addEntry() {
  const congratsElement = document.getElementById("congratulations");
  congratsElement.style.display = "none";

  const taskText = elements.inputBox.value.trim();
  if (!taskText) {
    showError("Enter something to be accomplished!!");
    return;
  }

  const existingTasks = Array.from(containers.do.children).map((li) => {
    const textEl = li.querySelector(".task-text");
    return textEl ? textEl.textContent.trim().toLowerCase() : "";
  });

  if (existingTasks.includes(taskText.toLowerCase())) {
    showError("Task already exists!! Is there anything else?");
    return;
  }

  elements.errorMessage.style.display = "none";
  const now = nowIso();
  const newTask = createTaskElement(taskText, "do", "low", "", "", false, now, "", {
    createdAt: now,
    updatedAt: now,
    stageHistory: [{ stage: "DO", enteredAt: now }],
  });
  containers.do.appendChild(newTask);

  elements.inputBox.value = "";
  saveTask();
  checkCompletion();
}

export function checkCompletion() {
  const congrats = document.getElementById("congratulations");
  const hasDoTasks = containers.do.children.length > 0;
  const hasDoingTasks = containers.doing.children.length > 0;
  const hasDoneTasks = containers.done.children.length > 0;

  if (!hasDoTasks && !hasDoingTasks && hasDoneTasks) {
    congrats.innerHTML = getRandomMessage();
    congrats.style.display = "block";
  } else {
    congrats.style.display = "none";
  }
}

export function showTask() {
  const tasks = readTasksFromStorage();
  containers.do.innerHTML = "";
  containers.doing.innerHTML = "";
  containers.done.innerHTML = "";

  tasks.forEach((task) => {
    const section = task.status || "do";
    const li = createTaskElement(task.text, section, task.priority, task.description, task.duedate, task.checked, task.dateAdded, task.tags, {
      id: task.id,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      stageHistory: task.stageHistory,
    });
    containers[section].appendChild(li);
  });

  checkCompletion();
  updateNotifications();
  window.dispatchEvent(new CustomEvent("kanba:tasks-rendered"));
}

export function updateDueStatus(li) {
  li.classList.remove("overdue", "due-soon");
  if (!li.dataset.duedate) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${li.dataset.duedate}T00:00:00`);

  if (due < today && li.dataset.status !== "done") {
    li.classList.add("overdue");
  }

  const diffInDays = (due - today) / (1000 * 60 * 60 * 24);
  if (diffInDays >= 0 && diffInDays < 2 && li.dataset.status !== "done") {
    li.classList.add("due-soon");
  }
}

export function assignDragHandlers(li) {
  const id = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  li.id = id;
  li.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", id);
  });
}

["do", "doing", "done"].forEach((section) => {
  const container = containers[section];
  if (!container) return;
  container.setAttribute("aria-label", `${section} task list`);
  container.setAttribute("role", "list");
});

export function updateNotifications() {
  const count = Array.from(document.querySelectorAll(".task-item")).filter((task) => task.classList.contains("overdue")).length;
  const badge = document.getElementById("notification-count");
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

export function extendDueDate(taskText) {
  const tasks = readTasksFromStorage();
  const updated = tasks.map((task) => {
    if (task.text === taskText && task.duedate) {
      const newDate = new Date(`${task.duedate}T00:00:00`);
      newDate.setDate(newDate.getDate() + 3);
      task.duedate = newDate.toISOString().split("T")[0];
      task.updatedAt = nowIso();
    }
    return task;
  });

  localStorage.setItem("kanbaTasks", JSON.stringify(updated));
  showTask();
  renderWarnings();
}

export function openTaskEditorById(taskId) {
  if (!taskId) return false;
  const li = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
  if (!li) return false;
  li.scrollIntoView({ behavior: "smooth", block: "center" });
  li.classList.add("focus-flash");
  setTimeout(() => li.classList.remove("focus-flash"), 1000);
  li.click();
  return true;
}
