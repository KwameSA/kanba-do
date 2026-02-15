import { elements } from "./constants.js";

import { showTask, updateDueStatus, updateNotifications } from "./tasks.js";
import { stringToColor } from "./utils.js";
import { saveTask } from "./storage.js";
import { nowIso } from "./task-model.js";
import { CUSTOM_VALUE, applyActivityToControls, getActivityTypeFromControls, getLastActivityType, setLastActivityType } from "./activity-types.js";
import { getSuggestedActivityType, updateTagToActivityMap } from "./tag-activity-map.js";
import { applyRecurrenceToControls, readRecurrenceFromControls } from "./recurrence-ui.js";

let currentTaskElement = null;

export function setCurrentTaskElement(taskEl) {
  currentTaskElement = taskEl;
}

export function bindModalEvents() {
  if (elements.modalActivityType && elements.modalActivityCustom) {
    elements.modalActivityType.addEventListener("change", () => {
      elements.modalActivityType.dataset.userTouched = "true";
      const isCustom = elements.modalActivityType.value === CUSTOM_VALUE;
      elements.modalActivityCustom.style.display = isCustom ? "block" : "none";
      if (!isCustom) elements.modalActivityCustom.value = "";
    });
    elements.modalActivityCustom.addEventListener("input", () => {
      elements.modalActivityType.dataset.userTouched = "true";
    });
  }

  // Activity type stays at "None" unless the user explicitly chooses one.

  if (elements.modalRecurrenceType && elements.modalRecurrenceDays) {
    elements.modalRecurrenceType.addEventListener("change", () => {
      const type = elements.modalRecurrenceType.value;
      const isCustom = type === "custom";
      elements.modalRecurrenceDays.style.display = isCustom ? "flex" : "none";
      if (!isCustom) {
        elements.modalRecurrenceDays.querySelectorAll("input[type=checkbox]").forEach((input) => {
          input.checked = false;
        });
      }
    });
  }

  elements.saveModal.addEventListener("click", () => {
    if (!currentTaskElement) return;

    const taskText = currentTaskElement.querySelector(".task-text");
    const priorityDot = currentTaskElement.querySelector(".priority-indicator");

    taskText.textContent = elements.modalTaskName.value.trim();
    currentTaskElement.dataset.description = elements.modalTaskDescription.value.trim();
    currentTaskElement.dataset.priority = elements.modalTaskPriority.value;
    currentTaskElement.dataset.duedate = elements.modalTaskDueDate.value;
    currentTaskElement.dataset.tags = elements.modalTaskTags.value.trim();
    const activityType = getActivityTypeFromControls(elements.modalActivityType.value, elements.modalActivityCustom.value);
    currentTaskElement.dataset.activityType = activityType;
    if (elements.modalRecurrenceType && elements.modalRecurrenceDays) {
      const recurrence = readRecurrenceFromControls(elements.modalRecurrenceType, elements.modalRecurrenceDays);
      currentTaskElement.dataset.recurrence = recurrence ? JSON.stringify(recurrence) : "";
      applyRecurrenceToControls(elements.modalRecurrenceType, elements.modalRecurrenceDays, recurrence);
    }
    currentTaskElement.dataset.updatedAt = nowIso();

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

    setLastActivityType(activityType);
    updateTagToActivityMap(elements.modalTaskTags.value, activityType);
    saveTask();
    showTask();
    elements.taskModal.style.display = "none";
    updateNotifications();
  });
}
