import { containers, elements } from "./constants.js";

import { saveTask } from "./storage.js";
import { updateTagFilterUI } from "./filters.js";
import { stringToColor, showError, getRandomMessage } from "./utils.js";
import { renderWarnings } from "./analytics.js";
import { setCurrentTaskElement } from "./modals.js";

// let currentSection = "do";
let currentTaskElement = null;
let activeTagFilter = null;

// function saveTask() {
//   saveTasksToStorage();
//   updateNotifications();
// }

export function createTaskElement(text, status, priority = "low", description = "", duedate = "", checked = false, dateAdded = new Date().toISOString(), tags = "") {
  const taskNode = elements.taskTemplate.content.cloneNode(true);
  const li = taskNode.querySelector("li");
  setCurrentTaskElement(li);

  const taskText = li.querySelector(".task-text");
  const dot = li.querySelector(".priority-indicator");
  const deleteBtn = li.querySelector(".delete");
  const moveBtn = li.querySelector(".move");
  const checkBtn = li.querySelector(".checkbox-icon");
  const tagContainer = li.querySelector(".task-tags");

  taskText.textContent = text;
  dot.classList.remove("priority-low", "priority-medium", "priority-high");
  dot.classList.add(`priority-${priority}`);

  li.dataset.status = status;
  li.dataset.priority = priority;
  li.dataset.description = description;
  li.dataset.duedate = duedate;
  li.dataset.checked = checked ? "true" : "false";
  li.dataset.dateAdded = dateAdded;
  li.dataset.tags = tags;

  if (checked) li.classList.add("checked");
  li.draggable = true;

  deleteBtn.onclick = () => {
    li.remove();
    saveTask();
  };

  moveBtn.onclick = () => moveTaskBackward(li);

  checkBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const currentStatus = li.dataset.status;
    if (currentStatus === "do" || currentStatus === "doing") {
      li.classList.add("checked");
      li.dataset.checked = "true";
      moveTaskForward(li);
    } else {
      li.classList.remove("checked");
      li.dataset.checked = "false";
      moveTaskBackward(li);
    }
    saveTask();
  });

  deleteBtn.style.display = status === "do" ? "inline" : "none";
  moveBtn.style.display = status === "doing" ? "inline" : "none";

  li.addEventListener("click", (e) => {
    if (e.target.closest(".delete, .move, .move-btn")) return;
    currentTaskElement = li;

    modalTaskName.value = taskText.textContent.trim();
    modalTaskPriority.value = li.dataset.priority || "low";
    modalTaskDescription.value = li.dataset.description || "";
    modalTaskDueDate.value = li.dataset.duedate || "";
    modalTaskTags.value = li.dataset.tags || "";

    taskModal.style.display = "flex";
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
        tagContainer.appendChild(tagBubble);

        tagBubble.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleTagFilter(tag);
        });
      });
  }

  updateDueStatus(li);
  updateNotifications();

  return li;
}

export function moveTaskForward(li) {
  const status = li.dataset.status;
  const deleteBtn = li.querySelector(".delete");
  const moveBackBtn = li.querySelector(".move");

  if (status === "do") {
    containers.doing.appendChild(li);
    li.dataset.status = "doing";

    deleteBtn.style.display = "none";
    moveBackBtn.style.display = "inline";
    li.classList.remove("checked");
    li.dataset.checked = "false";
  } else if (status === "doing") {
    containers.done.appendChild(li);
    li.dataset.status = "done";
    li.dataset.completedAt = new Date().toISOString();

    deleteBtn.style.display = "none";
    moveBackBtn.style.display = "none";
    li.classList.add("checked");
    li.dataset.checked = "true";
  }

  checkCompletion();
  saveTask();
}

export function moveTaskBackward(li) {
  const status = li.dataset.status;
  const deleteBtn = li.querySelector(".delete");
  const moveBackBtn = li.querySelector(".move");

  if (status === "done") {
    containers.doing.appendChild(li);
    li.dataset.status = "doing";

    deleteBtn.style.display = "none";
    moveBackBtn.style.display = "inline";
    li.classList.remove("checked");
    li.dataset.checked = "false";
  } else if (status === "doing") {
    containers.do.appendChild(li);
    li.dataset.status = "do";

    deleteBtn.style.display = "inline";
    moveBackBtn.style.display = "none";
    li.classList.remove("checked");
    li.dataset.checked = "false";
  }

  checkCompletion();
  saveTask();
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

  const newTask = createTaskElement(taskText, "do", "low", "", "", false);
  containers.do.appendChild(newTask);

  elements.inputBox.value = "";
  saveTask();
  checkCompletion();
}

function toggleTagFilter(tag) {
  const allTasks = document.querySelectorAll(".task-item");

  if (activeTagFilter === tag) {
    activeTagFilter = null;
    allTasks.forEach((task) => (task.style.display = "flex"));
    updateTagFilterUI(null);
  } else {
    activeTagFilter = tag;
    allTasks.forEach((task) => {
      const taskTags = (task.dataset.tags || "").split(",").map((t) => t.trim());
      task.style.display = taskTags.includes(tag) ? "flex" : "none";
    });
    updateTagFilterUI(tag);
  }
}

export function checkCompletion() {
  const congrats = document.getElementById("congratulations");

  const hasDoTasks = containers.do.children.length > 0;
  const hasDoingTasks = containers.doing.children.length > 0;
  const hasDoneTasks = containers.done.children.length > 0;

  if (!hasDoTasks && !hasDoingTasks && hasDoneTasks) {
    const message = getRandomMessage();
    congrats.innerHTML = message;
    congrats.style.display = "block";
  } else {
    congrats.style.display = "none";
  }
}

export function showTask() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];

  containers.do.innerHTML = "";
  containers.doing.innerHTML = "";
  containers.done.innerHTML = "";

  tasks.forEach((task) => {
    const section = task.status || "do";
    const li = createTaskElement(task.text, section, task.priority, task.description, task.duedate, task.checked, task.dateAdded, task.tags);
    containers[section].appendChild(li);
  });

  checkCompletion();
  updateNotifications();
}

export function updateDueStatus(li) {
  li.classList.remove("overdue", "due-soon");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(li.dataset.duedate);
  due.setHours(0, 0, 0, 0);

  if (li.dataset.duedate && due < today) {
    li.classList.add("overdue");
  }

  const diffInDays = (due - today) / (1000 * 60 * 60 * 24);
  if (diffInDays >= 0 && diffInDays < 2) {
    li.classList.add("due-soon");
  }
}

export function assignDragHandlers(li) {
  const id = "task-" + Date.now() + Math.floor(Math.random() * 1000);
  li.id = id;
  li.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", id);
  });
}

["do", "doing", "done"].forEach((section) => {
  containers[section].setAttribute("aria-label", `${section} task list`);
  containers[section].setAttribute("role", "list");
});

export function updateNotifications() {
  const count = Array.from(document.querySelectorAll(".task-item")).filter((task) => task.classList.contains("overdue")).length;

  const badge = document.getElementById("notification-count");
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

export function extendDueDate(taskText) {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];

  const updated = tasks.map((task) => {
    if (task.text === taskText && task.duedate) {
      const newDate = new Date(task.duedate);
      newDate.setDate(newDate.getDate() + 3);
      task.duedate = newDate.toISOString().split("T")[0];
    }
    return task;
  });

  localStorage.setItem("kanbaTasks", JSON.stringify(updated));
  showTask();
  renderWarnings();
}
