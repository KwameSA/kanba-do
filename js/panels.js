import { containers } from "./constants.js";
import { saveTask } from "./storage.js";

// Panel open/close
function openPanel(panelId, callback) {
  const panel = document.getElementById(panelId);
  const isActive = panel.classList.contains("active");

  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));

  if (!isActive) {
    panel.classList.add("active");
    if (typeof callback === "function") callback();
    document.getElementById("sidebar").classList.add("hidden");
  } else {
    document.getElementById("sidebar").classList.remove("hidden");
  }
}

function closeAllPanels() {
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  document.getElementById("sidebar").classList.remove("hidden");
}

// Drag-and-drop logic
function bindPanelEvents() {
  document.querySelectorAll(".close-panel").forEach((btn) => {
    btn.addEventListener("click", () => closeAllPanels());
  });

  ["do", "doing", "done"].forEach((section) => {
    containers[section].addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    containers[section].addEventListener("drop", (e) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("text/plain");
      const dragged = document.getElementById(taskId);
      if (dragged && containers[section]) {
        containers[section].appendChild(dragged);
        dragged.dataset.status = section;
        saveTask();
      }
    });
  });
}

export { openPanel, closeAllPanels, bindPanelEvents };
