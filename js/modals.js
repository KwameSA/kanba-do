import { elements } from "./constants.js";

import { showTask, updateDueStatus, updateNotifications } from "./tasks.js";
import { stringToColor } from "./utils.js";
import { saveTask } from "./storage.js";

let currentTaskElement = null;

export function setCurrentTaskElement(taskEl) {
  currentTaskElement = taskEl;
}

export function bindModalEvents() {
  elements.saveModal.addEventListener("click", () => {
    if (!currentTaskElement) return;

    const taskText = currentTaskElement.querySelector(".task-text");
    const priorityDot = currentTaskElement.querySelector(".priority-indicator");

    taskText.textContent = elements.modalTaskName.value.trim();
    currentTaskElement.dataset.description = elements.modalTaskDescription.value.trim();
    currentTaskElement.dataset.priority = elements.modalTaskPriority.value;
    currentTaskElement.dataset.duedate = elements.modalTaskDueDate.value;
    currentTaskElement.dataset.tags = elements.modalTaskTags.value.trim();

    priorityDot.classList.remove("priority-low", "priority-medium", "priority-high");
    priorityDot.classList.add(`priority-${elements.modalTaskPriority.value}`);

    updateDueStatus(currentTaskElement);

    const tagContainer = currentTaskElement.querySelector(".task-tags");
    tagContainer.innerHTML = "";

    const tags = elements.modalTaskTags.value.trim();
    currentTaskElement.dataset.tags = tags;

    if (tags.length > 0) {
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
        });
    }

    saveTask();
    showTask();
    elements.taskModal.style.display = "none";
    updateNotifications();
  });
}
