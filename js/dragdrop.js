import { containers } from "./constants.js";
import { moveTaskToStatus } from "./tasks.js";

export function bindDragDrop() {
  ["do", "doing", "done"].forEach((section) => {
    const container = containers[section];
    if (!container) return;

    container.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    container.addEventListener("drop", (e) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("text/plain");
      const dragged = document.getElementById(taskId);
      if (dragged) {
        moveTaskToStatus(dragged, section);
      }
    });
  });
}
