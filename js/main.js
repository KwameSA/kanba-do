import { bindBoardEvents } from "./board-events.js";
import { bindDragDrop } from "./dragdrop.js";
import { showTask, updateNotifications } from "./tasks.js";
import { saveDailySnapshot } from "./storage.js";
import { initCommon } from "./page-common.js";
import { bindModalEvents } from "./modals.js";
import { initBoardAside } from "./board-aside.js";

// Run everything only after DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  initCommon();
  bindModalEvents();
  // Set footer year
  document.getElementById("currentYear").textContent = new Date().getFullYear();
  bindBoardEvents();
  bindDragDrop();
  initBoardAside();

  showTask();
  updateNotifications();
  saveDailySnapshot();
});
