import { containers } from "./constants.js";

export function sortTasks(section, mode) {
  const items = Array.from(containers[section].children);
  items.sort((a, b) => {
    if (mode === "alpha") {
      return a.querySelector(".task-text").textContent.localeCompare(b.querySelector(".task-text").textContent);
    } else if (mode === "date") {
      return new Date(a.dataset.dateAdded) - new Date(b.dataset.dateAdded);
    } else if (mode === "priority") {
      const priorityRank = { high: 3, medium: 2, low: 1 };
      return priorityRank[b.dataset.priority] - priorityRank[a.dataset.priority];
    } else if (mode === "due") {
      const dateA = a.dataset.duedate ? new Date(a.dataset.duedate) : new Date(8640000000000000);
      const dateB = b.dataset.duedate ? new Date(b.dataset.duedate) : new Date(8640000000000000);
      return dateA - dateB;
    }
  });

  containers[section].innerHTML = "";
  items.forEach((item) => containers[section].appendChild(item));
}

export function updateTagFilterUI(tag) {
  const indicator = document.getElementById("tag-filter-indicator");
  const label = document.getElementById("active-tag-label");

  if (tag) {
    indicator.style.display = "block";
    label.textContent = `#${tag}`;
  } else {
    indicator.style.display = "none";
    label.textContent = "";
  }
}
