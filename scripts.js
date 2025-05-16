// VARIABLE DECLARATIONS
const inputBox = document.getElementById("input-box");
const errorMessage = document.getElementById("error-message");
const sortOptionsDo = document.getElementById("sort-options-do");
const sortOptionsDone = document.getElementById("sort-options-done");
const searchStatus = document.getElementById("search-status");
const taskModal = document.getElementById("taskModal");
const saveModal = document.getElementById("saveModal");
const cancelModal = document.getElementById("cancelModal");
const modalTaskName = document.getElementById("modalTaskName");
const modalTaskDescription = document.getElementById("modalTaskDescription");
const modalTaskPriority = document.getElementById("modalTaskPriority");
const modalTaskDueDate = document.getElementById("modalTaskDueDate");
const taskTemplate = document.getElementById("task-template");
const taskViewSelect = document.getElementById("task-view-options");
const lightModeIcon = document.getElementById("sun-icon");
const darkModeIcon = document.getElementById("moon-icon");
const closeAllPanelsBtn = document.getElementsByClassName("close-panel");
const resetBtn = document.getElementById("clearTasksBtn");
const resetModal = document.getElementById("reset-modal");
const cancelReset = document.getElementById("cancel-reset");
const confirmReset = document.getElementById("confirm-reset");
const simToggle = document.getElementById("sim-toggle");
const simIcon = document.getElementById("sim-toggle-icon");

let currentSection = "do";
let currentTaskElement = null;

const containers = {
  do: document.getElementById("do-container"),
  doing: document.getElementById("doing-container"),
  done: document.getElementById("done-container"),
};

const allMessages = [
  "Amazing! You&rsquo;ve tackled everything on your plate!",
  "Outstanding! Task list cleared like a champ!",
  "Bravo! All tasks have been conquered!",
  "Great job! You&rsquo;ve crossed the finish line!",
  "Fantastic! No more tasks, time to celebrate!",
  "Mission accomplished! What a pro!",
  "You&rsquo;re on fire! Every task is done! 🔥",
  "Boom! All tasks obliterated! 💥",
  "Victory is yours! Nothing left to do! 🏆",
  "Cheers to your productivity! 🍻",
  "Kudos! You&rsquo;re officially task-free!",
  "You&rsquo;ve earned a break&mdash;awesome job! ☕",
  "You&rsquo;re a rockstar! No tasks left behind! 🎸",
  "Legendary performance! All clear! 👑",
  "Amazing effort! Everything is checked off! ✅",
  "Fantastic work! You&rsquo;ve aced it all! 💯",
  "Done and dusted! Time to relax. 🧘",
  "Woohoo! Everything is complete! 🎉",
  "Epic win! Your list is empty! 🚀",
  "Incredible! You&rsquo;ve achieved task-zero!",
  "You&rsquo;re unstoppable! No tasks remain!",
  "Congratulations! You&rsquo;ve mastered productivity! 🧠",
  "What a superstar! Tasks cleared effortlessly.",
  "Impressive! You&rsquo;ve knocked it out of the park! ⚾",
  "All done? You&rsquo;re officially amazing!",
  "Gold medal for productivity goes to you! 🥇",
  "Bravo! Task-free zone achieved!",
  "Excellence at its best! Great job! ⭐",
  "You&rsquo;re a legend! Mission complete.",
  "Smashing success! Your list is history! 📜",
  "Phenomenal! Tasks cleared in style! ✨",
  "Outstanding effort! Nothing left undone.",
  "Mic drop! You&rsquo;ve done it all. 🎤",
  "Unstoppable force! List zero achieved.",
  "You&rsquo;ve crushed it! Every task is history.",
  "Hats off! Your tasks have been obliterated! 🎩",
  "Round of applause! Task-free life achieved. 👏",
  "You&rsquo;re a wizard of productivity! 🧙‍♂️",
  "Perfection achieved! Tasks are gone. 🌟",
  "High five! Your list is history. 🙌",
  "You&rsquo;re the boss! Task-free status unlocked. 💼",
  "Masterclass in productivity! Everything&rsquo;s done.",
  "Zero tasks, 100% success. 📈",
  "Achievement unlocked: Inbox Zero, Board Zero. 🕹️",
  "The task board has been vanquished. ⚔️",
  "Clean slate vibes only. 🧼",
  "You deserve cake. 🍰",
];

function addEntry() {
  const congratsElement = document.getElementById("congratulations");
  congratsElement.style.display = "none";

  const taskText = inputBox.value.trim();

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

  errorMessage.style.display = "none";

  const newTask = createTaskElement(taskText, "do", "low", "", "", false);
  containers.do.appendChild(newTask);

  inputBox.value = "";
  saveTask();
  checkCompletion();
}

function createTaskElement(text, status, priority = "low", description = "", duedate = "", checked = false, dateAdded = new Date().toISOString(), tags = "") {
  const taskNode = taskTemplate.content.cloneNode(true);
  const li = taskNode.querySelector("li");

  const taskText = li.querySelector(".task-text");
  const dot = li.querySelector(".priority-indicator");
  const deleteBtn = li.querySelector(".delete");
  const moveBtn = li.querySelector(".move");
  const checkBtn = li.querySelector(".checkbox-icon");
  const tagSpan = document.createElement("span");
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

    // Pulls from dataset instead of stale variables. Gave me a headache when I moved to version 3.
    modalTaskName.value = li.querySelector(".task-text").textContent.trim();
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

let activeTagFilter = null;

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

function updateTagFilterUI(tag) {
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

document.getElementById("clear-tag-filter").addEventListener("click", () => {
  toggleTagFilter(activeTagFilter);
});

saveModal.addEventListener("click", () => {
  if (currentTaskElement) {
    const taskText = currentTaskElement.querySelector(".task-text");
    const priorityDot = currentTaskElement.querySelector(".priority-indicator");

    taskText.textContent = modalTaskName.value.trim();
    currentTaskElement.dataset.description = modalTaskDescription.value.trim();
    currentTaskElement.dataset.priority = modalTaskPriority.value;
    currentTaskElement.dataset.duedate = modalTaskDueDate.value;
    currentTaskElement.dataset.tags = modalTaskTags.value.trim();

    priorityDot.classList.remove("priority-low", "priority-medium", "priority-high");
    priorityDot.classList.add(`priority-${modalTaskPriority.value}`);

    updateDueStatus(currentTaskElement);

    const tagContainer = currentTaskElement.querySelector(".task-tags");
    tagContainer.innerHTML = "";

    const tags = modalTaskTags.value.trim();
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
    } else {
      tagContainer.innerHTML = "";
    }

    saveTask();
    showTask();
    taskModal.style.display = "none";
    updateNotifications();
  }
});

cancelModal.addEventListener("click", () => {
  taskModal.style.display = "none";
});

resetBtn.addEventListener("click", () => {
  resetModal.classList.remove("hidden");
});

cancelReset.addEventListener("click", () => {
  resetModal.classList.add("hidden");
});

confirmReset.addEventListener("click", () => {
  localStorage.removeItem("kanbaTasks");
  showTask();
  resetModal.classList.add("hidden");
});

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

function showTask() {
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

const lastSection = localStorage.getItem("lastSection") || "todo-app";

document.querySelectorAll(".todo-app, .todoing-app, .todone-app").forEach((el) => {
  el.style.display = "none";
});

document.querySelector(`.${lastSection}`).style.display = "block";

function moveTaskForward(li) {
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

function moveTaskBackward(li) {
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

// SIMULATION FUNCTIONS

function simulateFakeTrendData() {
  const fakeTrends = [];

  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 6); // 6 days ago

  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    fakeTrends.push({
      date: dateStr,
      do: Math.max(0, 7 - i),
      doing: i % 3,
      done: i,
    });
  }

  localStorage.setItem("kanbaTrends", JSON.stringify(fakeTrends));
}

function simulateFakeTasksWithTags() {
  const fakeTasks = [];

  const tagPool = ["school", "urgent", "project", "fitness", "fun", "deepwork", "health", "family", "read", "longterm"];

  for (let i = 0; i < 20; i++) {
    const tagCount = Math.floor(Math.random() * 2) + 1; // 1–2 tags per task
    const tags = [];

    while (tags.length < tagCount) {
      const tag = tagPool[Math.floor(Math.random() * tagPool.length)];
      if (!tags.includes(tag)) tags.push(tag);
    }

    fakeTasks.push({
      text: `Fake Task ${i + 1}`,
      description: "Auto-generated",
      priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
      duedate: "",
      checked: false,
      dateAdded: new Date().toISOString(),
      status: ["do", "doing", "done"][Math.floor(Math.random() * 3)],
      tags: tags.join(","),
    });
  }

  localStorage.setItem("kanbaTasks", JSON.stringify(fakeTasks));
}

function simulateInsightsData() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];

  const updatedTasks = tasks.map((task, i) => {
    if (task.status === "done") {
      const base = new Date();
      base.setDate(base.getDate() - (i % 5)); // Spread over 5 recent days

      const daysTaken = Math.floor(Math.random() * 4) + 1; // 1–4 days to complete
      const added = new Date(base);
      const completed = new Date(base);
      completed.setDate(base.getDate() + daysTaken);

      return {
        ...task,
        dateAdded: added.toISOString(),
        completedAt: completed.toISOString(),
      };
    }
    return task;
  });

  localStorage.setItem("kanbaTasks", JSON.stringify(updatedTasks));
}

function simulateWarningsData() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];

  const today = new Date();
  const stagnantDate = new Date(today);
  stagnantDate.setDate(today.getDate() - 5);

  // Add stagnant tasks
  for (let i = 0; i < 4; i++) {
    tasks.push({
      text: `Stagnant Task ${i + 1}`,
      description: "Hasn't moved",
      priority: "medium",
      duedate: "",
      checked: false,
      dateAdded: stagnantDate.toISOString(),
      status: i % 2 === 0 ? "do" : "doing",
      tags: "stuck",
    });
  }

  // Add overloaded tag tasks
  for (let i = 0; i < 6; i++) {
    tasks.push({
      text: `Overload Task ${i + 1}`,
      description: "Too many of this tag",
      priority: "high",
      duedate: "",
      checked: false,
      dateAdded: today.toISOString(),
      status: "do",
      tags: "urgent",
    });
  }

  localStorage.setItem("kanbaTasks", JSON.stringify(tasks));
}

function simulatePriorityTrends() {
  const fakeTrends = [];
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 6); // 6 days ago

  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const low = Math.floor(Math.random() * 4);
    const medium = Math.floor(Math.random() * 4);
    const high = Math.floor(Math.random() * 4);

    fakeTrends.push({
      date: dateStr,
      do: Math.floor(Math.random() * 4),
      doing: Math.floor(Math.random() * 3),
      done: Math.floor(Math.random() * 5),
      low,
      medium,
      high,
    });
  }

  localStorage.setItem("kanbaTrends", JSON.stringify(fakeTrends));
}

function simulateTagCompletionData() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];

  const tagOptions = ["school", "fun", "project", "fitness", "urgent", "longterm"];
  const updated = tasks.map((task, i) => {
    if (task.status === "done") {
      const tag = tagOptions[i % tagOptions.length];
      return {
        ...task,
        tags: tag,
        completedAt: task.completedAt || new Date().toISOString(),
      };
    }
    return task;
  });

  localStorage.setItem("kanbaTasks", JSON.stringify(updated));
}

// SIMULATION FUNCTIONS

document.querySelectorAll(".top-btn-nav button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    localStorage.setItem("lastSection", target); // Save view
    document.querySelectorAll(".todo-app, .todoing-app, .todone-app").forEach((el) => {
      el.style.display = "none";
    });
    document.querySelector(`.${target}`).style.display = "block";
  });
});

function triggerVibration(duration = 150) {
  if ("vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  triggerVibration();
}

inputBox.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addEntry();
  }
});

searchStatus.addEventListener("input", () => {
  const term = searchStatus.value.trim().toLowerCase();
  const info = document.getElementById("search-info");

  if (term.length > 0) {
    info.style.display = "block";
  } else {
    info.style.display = "none";
  }

  // Disable tag filter during search
  if (term.length > 0) {
    activeTagFilter = null;
    updateTagFilterUI(null);
  }

  ["do", "doing", "done"].forEach((section) => {
    Array.from(containers[section].children).forEach((li) => {
      const taskTextEl = li.querySelector(".task-text");
      const originalText = taskTextEl?.dataset.originalText || taskTextEl.textContent;
      const title = originalText.toLowerCase();
      const description = (li.dataset.description || "").toLowerCase();
      const tags = (li.dataset.tags || "").toLowerCase();

      // Combine with tag filter (AND logic)
      const tagMatches =
        !activeTagFilter ||
        (li.dataset.tags || "")
          .split(",")
          .map((t) => t.trim())
          .includes(activeTagFilter);

      const searchMatches = title.includes(term) || description.includes(term) || tags.includes(term);

      const show = searchMatches && tagMatches;
      li.style.display = show ? "flex" : "none";

      // Highlight match only in title
      if (term && title.includes(term)) {
        const matchStart = title.indexOf(term);
        const matchEnd = matchStart + term.length;
        const before = originalText.slice(0, matchStart);
        const match = originalText.slice(matchStart, matchEnd);
        const after = originalText.slice(matchEnd);
        taskTextEl.innerHTML = `${before}<mark>${match}</mark>${after}`;
        taskTextEl.dataset.originalText = originalText;
      } else {
        taskTextEl.innerHTML = originalText;
      }
    });
  });
});

taskViewSelect.addEventListener("change", (e) => {
  const value = e.target.value;

  if (value.startsWith("sort-")) {
    const mode = value.replace("sort-", "");
    ["do", "doing", "done"].forEach((section) => {
      sortTasks(section, mode);
    });
  } else if (value.startsWith("filter-")) {
    const filter = value.replace("filter-", "");

    document.querySelectorAll(".task-item").forEach((task) => {
      const priority = task.dataset.priority;
      const isOverdue = task.classList.contains("overdue");
      const isDueSoon = task.classList.contains("due-soon");

      if (filter === "all") {
        task.style.display = "flex";
      } else if (filter === "overdue") {
        task.style.display = isOverdue ? "flex" : "none";
      } else if (filter === "duesoon") {
        task.style.display = isDueSoon ? "flex" : "none";
      } else {
        task.style.display = priority === filter ? "flex" : "none";
      }
    });
  }
});

function sortTasks(section, mode) {
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

function updateDueStatus(li) {
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

inputBox.addEventListener("focus", () => {
  errorMessage.style.display = "none";
});

cancelModal.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    taskModal.style.display = "none";
  }
});

document.querySelectorAll(".close-panel").forEach((btn) => {
  btn.addEventListener("click", () => {
    closeAllPanels();
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAllPanels();
  }
});

function closeAllPanels() {
  document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
  document.getElementById("sidebar").classList.remove("hidden");
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && taskModal.style.display === "flex") {
    taskModal.style.display = "none";
  }
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

// Assign a unique id and dragstart to each task on creation
function assignDragHandlers(li) {
  const id = "task-" + Date.now() + Math.floor(Math.random() * 1000);
  li.id = id;
  li.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", id);
  });
}

// Hook drag logic in createTaskElement

["do", "doing", "done"].forEach((section) => {
  containers[section].setAttribute("aria-label", `${section} task list`);
  containers[section].setAttribute("role", "list");
});

document.querySelectorAll("button, select, input, textarea").forEach((el) => {
  el.setAttribute("tabindex", "0");
});

document.querySelectorAll(".delete, .move, .move-btn").forEach((btn) => {
  btn.setAttribute("aria-label", btn.textContent.trim() || "action");
});

document.addEventListener("keydown", (e) => {
  const modalIsOpen = taskModal.style.display === "flex";

  if (!modalIsOpen) return;

  if (e.key === "Escape") {
    cancelModal.click();
  }

  if (e.key === "Enter") {
    e.preventDefault();
    saveModal.click();
  }
});

const toggleButton = document.getElementById("dark-mode-toggle");
const icon = darkModeIcon;

toggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");

  icon.classList.remove(isDark ? "fa-moon" : "fa-sun");
  icon.classList.add(isDark ? "fa-sun" : "fa-moon");

  localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
});

if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark");
  icon.classList.remove("fa-moon");
  icon.classList.add("fa-sun");
} else {
  icon.classList.remove("fa-sun");
  icon.classList.add("fa-moon");
}

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 80%)`;
}

function getRandomMessage() {
  if (!window.unusedMessages || unusedMessages.length === 0) {
    window.unusedMessages = [...allMessages];
  }

  const index = Math.floor(Math.random() * unusedMessages.length);
  const message = unusedMessages[index];
  unusedMessages.splice(index, 1); // Remove that message from the array
  return message;
}

function checkCompletion() {
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

function exportTasksToCSV() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];

  if (!tasks.length) {
    alert("No tasks to export.");
    return;
  }

  const headers = ["Text", "Description", "Priority", "Due Date", "Checked", "Date Added", "Completed At", "Status", "Tags"];

  const rows = tasks.map((task) => [`"${task.text}"`, `"${task.description || ""}"`, `"${task.priority || ""}"`, `"${task.duedate || ""}"`, task.checked, `"${task.dateAdded || ""}"`, `"${task.completedAt || ""}"`, `"${task.status || ""}"`, `"${task.tags || ""}"`]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "kanba-tasks.csv");
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Side Bar Interactivity

// Export current tasks to downloadable JSON file
document.getElementById("export-btn").addEventListener("click", () => {
  const data = localStorage.getItem("kanbaTasks");
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "kanba_tasks_backup.json";
  a.click();

  URL.revokeObjectURL(url);
});

// Handle file input for import
document.getElementById("import-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const tasks = JSON.parse(event.target.result);
      localStorage.setItem("kanbaTasks", JSON.stringify(tasks));
      showTask();
      document.getElementById("import-status").textContent = "✅ Tasks imported successfully!";
    } catch (err) {
      document.getElementById("import-status").textContent = "❌ Invalid file.";
    }
  };
  reader.readAsText(file);
});

document.querySelectorAll(".insights-tabs button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.insight;

    // 👉 Remove active class from all buttons
    document.querySelectorAll(".insights-tabs button").forEach((b) => b.classList.remove("active"));

    // 👉 Add it to the clicked one
    btn.classList.add("active");

    // Hide all cards
    document.querySelectorAll(".insight-card").forEach((card) => {
      card.classList.add("hidden");
    });

    // Show the selected card
    if (target === "completion") {
      document.querySelector(".completion-card").classList.remove("hidden");
    } else if (target === "priority") {
      document.querySelector(".priority-card").classList.remove("hidden");
    } else if (target === "tag") {
      document.querySelector(".tag-card").classList.remove("hidden");
    }

    // Also show the matching chart if you're still managing them separately
    if (target === "completion") {
      document.getElementById("completionTimeChart").classList.remove("hidden");
    } else if (target === "priority") {
      document.getElementById("priorityTrendChart").classList.remove("hidden");
    } else if (target === "tag") {
      document.getElementById("completionRateByTagChart").classList.remove("hidden");
    }
  });
});

// Handle manual text input import
document.getElementById("import-btn").addEventListener("click", () => {
  const text = document.getElementById("import-textarea").value.trim();
  try {
    const tasks = JSON.parse(text);
    localStorage.setItem("kanbaTasks", JSON.stringify(tasks));
    showTask();
    document.getElementById("import-status").textContent = "✅ Tasks imported successfully!";
  } catch (err) {
    document.getElementById("import-status").textContent = "❌ Invalid JSON.";
  }
});

function downloadChartImage(chartId) {
  const canvas = document.getElementById(chartId);
  const link = document.createElement("a");
  link.download = `${chartId}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

document.querySelectorAll(".download-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const chartId = btn.dataset.chartId;
    downloadChartImage(chartId);
  });
});

function updateNotifications() {
  const count = Array.from(document.querySelectorAll(".task-item")).filter((task) => task.classList.contains("overdue")).length;

  const badge = document.getElementById("notification-count");
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function renderOverdueTasks() {
  const overdueList = document.getElementById("overdue-list");
  const duesoonList = document.getElementById("duesoon-list");
  const noOverdueMsg = document.getElementById("no-overdue-msg");
  const noDueSoonMsg = document.getElementById("no-duesoon-msg");

  overdueList.innerHTML = "";
  duesoonList.innerHTML = "";

  const allTasks = Array.from(document.querySelectorAll(".task-item"));

  const overdueTasks = allTasks.filter((task) => task.classList.contains("overdue"));
  const duesoonTasks = allTasks.filter((task) => task.classList.contains("due-soon") && !task.classList.contains("overdue"));

  // Overdue section
  if (overdueTasks.length === 0) {
    noOverdueMsg.style.display = "block";
  } else {
    noOverdueMsg.style.display = "none";
    overdueTasks.forEach((task) => {
      const li = document.createElement("li");
      li.textContent = `${task.querySelector(".task-text").textContent} — due ${task.dataset.duedate || "unknown"}`;
      overdueList.appendChild(li);
    });
  }

  // Due soon section
  if (duesoonTasks.length === 0) {
    noDueSoonMsg.style.display = "block";
  } else {
    noDueSoonMsg.style.display = "none";
    duesoonTasks.forEach((task) => {
      const li = document.createElement("li");
      li.textContent = `${task.querySelector(".task-text").textContent} — due ${task.dataset.duedate || "unknown"}`;
      duesoonList.appendChild(li);
    });
  }
}

// Toggle Functionality for the panel
function openPanel(panelId, callback) {
  const panel = document.getElementById(panelId);
  const isActive = panel.classList.contains("active");

  // Close all panels
  document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));

  if (!isActive) {
    panel.classList.add("active");

    // Optional: run any specific function for that panel
    if (typeof callback === "function") callback();

    // Hide sidebar
    document.getElementById("sidebar").classList.add("hidden");
  } else {
    // If already active and clicked again, re-show sidebar
    document.getElementById("sidebar").classList.remove("hidden");
  }
}

document.getElementById("notifications").addEventListener("click", () => {
  openPanel("notifications-panel", renderOverdueTasks);
});

document.getElementById("language-toggle").addEventListener("click", () => {
  openPanel("language-panel");
});

document.getElementById("open-import-export").addEventListener("click", () => {
  openPanel("import-export-panel");
});

document.getElementById("open-faq").addEventListener("click", () => {
  openPanel("faq-panel");
});

document.getElementById("open-analytics").addEventListener("click", () => {
  openPanel("analytics-panel", () => {
    renderAnalyticsChart();
    renderTrendChart();
    renderTagChart();
    renderInsights();
    renderCompletionChart();
    renderPriorityTrends();
    renderCompletionByTag();
    renderWarnings();
  });
});

function renderAnalyticsChart() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];

  const counts = { do: 0, doing: 0, done: 0 };
  tasks.forEach((task) => {
    if (counts[task.status] !== undefined) counts[task.status]++;
  });

  // @ts-ignore
  const ctx = document.getElementById("statusChart").getContext("2d");
  if (window.statusChart instanceof Chart) {
    window.statusChart.destroy();
  }

  window.statusChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["DO", "DOING", "DONE"],
      datasets: [
        {
          label: "Tasks by Status",
          data: [counts.do, counts.doing, counts.done],
          backgroundColor: ["#ff9999", "#ffcc99", "#99ff99"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Task Count" },
        },
      },
    },
  });

  document.getElementById("chartSummary").textContent = `You currently have ${counts.do} in DO, ${counts.doing} in DOING, and ${counts.done} in DONE.`;
}

function renderTrendChart() {
  const ctx = document.getElementById("trendChart").getContext("2d");
  const trends = JSON.parse(localStorage.getItem("kanbaTrends")) || [];

  const labels = trends.map((t) => t.date);
  const doData = trends.map((t) => t.do);
  const doingData = trends.map((t) => t.doing);
  const doneData = trends.map((t) => t.done);

  if (window.trendChart instanceof Chart) {
    window.trendChart.destroy();
  }

  window.trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "DO",
          data: doData,
          borderColor: "#ff9999",
          fill: false,
        },
        {
          label: "DOING",
          data: doingData,
          borderColor: "#ffcc99",
          fill: false,
        },
        {
          label: "DONE",
          data: doneData,
          borderColor: "#99ff99",
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: false,
        },
        legend: {
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Tasks",
          },
        },
      },
    },
  });
}

function renderTagChart() {
  const ctx = document.getElementById("tagChart").getContext("2d");
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];

  const tagCounts = {};

  tasks.forEach((task) => {
    const tags = (task.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    tags.forEach((tag) => {
      if (!tagCounts[tag]) {
        tagCounts[tag] = 0;
      }
      tagCounts[tag]++;
    });
  });

  const labels = Object.keys(tagCounts);
  const data = Object.values(tagCounts);

  if (window.tagChart instanceof Chart) {
    window.tagChart.destroy();
  }

  window.tagChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          label: "Tags",
          data,
          backgroundColor: labels.map((tag) => stringToColor(tag)),
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "right",
        },
      },
    },
  });
}

function renderInsights() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];
  const completedTasks = tasks.filter((t) => t.status === "done" && t.completedAt);

  const durations = completedTasks.map((t) => {
    const start = new Date(t.dateAdded);
    const end = new Date(t.completedAt);
    return (end - start) / (1000 * 60 * 60 * 24); // in days
  });

  const avgTime = durations.length > 0 ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) : "N/A";

  document.getElementById("average-completion-text").innerHTML = `<strong>Average Task Completion Time:</strong> ${avgTime} days`;
}

function renderCompletionChart() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];
  const completed = tasks.filter((t) => t.status === "done" && t.completedAt);

  const dateMap = {};

  completed.forEach((t) => {
    const completeDate = new Date(t.completedAt).toISOString().split("T")[0];
    const added = new Date(t.dateAdded);
    const completedAt = new Date(t.completedAt);
    const duration = (completedAt - added) / (1000 * 60 * 60 * 24);

    if (!dateMap[completeDate]) {
      dateMap[completeDate] = [];
    }
    dateMap[completeDate].push(duration);
  });

  const labels = Object.keys(dateMap).sort();
  const data = labels.map((date) => (dateMap[date].reduce((a, b) => a + b, 0) / dateMap[date].length).toFixed(2));

  const ctx = document.getElementById("completionTimeChart").getContext("2d");

  if (window.completionTimeChart instanceof Chart) {
    window.completionTimeChart.destroy();
  }

  window.completionTimeChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Avg Completion Time (Days)",
          data,
          fill: true,
          borderColor: "#36a2eb",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Days",
          },
        },
        x: {
          title: {
            display: true,
            text: "Completion Date",
          },
        },
      },
    },
  });
}

function renderWarnings() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];
  const today = new Date();

  const stagnantTasks = tasks.filter((t) => {
    if (t.status === "done") return false;
    const added = new Date(t.dateAdded);
    const age = (today - added) / (1000 * 60 * 60 * 24);
    return age > 3;
  });

  const tagCounts = {};
  const tagTasksMap = {};

  tasks.forEach((t) => {
    (t.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .forEach((tag) => {
        if (!tag) return;
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        tagTasksMap[tag] = tagTasksMap[tag] || [];
        tagTasksMap[tag].push(t);
      });
  });

  const overloadedTags = Object.entries(tagCounts)
    .filter(([_, count]) => count >= 5)
    .map(([tag]) => tag);

  // 📌 STAGNANT TASKS HTML
  const stagnantHTML = stagnantTasks.length
    ? stagnantTasks
        .map(
          (t) => `
      <div class="warning-item">
        <div class="warning-item-summary" data-id="${t.id}">
          <span class="warning-icon">🔺</span> ${t.text} — stuck in ${t.status}
        </div>
        <div class="warning-details hidden">
          ${t.description || "No description provided."}
          <br><br>
          <button class="extend-btn" data-text="${t.text}">Extend by 3 days</button>
        </div>
      </div>
    `
        )
        .join("")
    : `<p class="warning-item clear"><span class="warning-icon">✅</span> No stagnant tasks found!</p>`;

  document.getElementById("stagnant-warning-list").innerHTML = stagnantHTML;

  // 🏷️ TAG OVERLOAD HTML
  const tagHTML = overloadedTags.length
    ? overloadedTags
        .map((tag) => {
          const relatedTasks = tagTasksMap[tag]
            .map(
              (t) => `
              <div class="nested-task">
                <span class="nested-task-summary">${t.text}</span>
                <div class="warning-details hidden">${t.description || "No description provided."}</div>
              </div>
            `
            )
            .join("");

          return `
            <div class="warning-item">
              <div class="warning-item-summary" data-tag="${tag}">
                <span class="warning-icon">🚨</span> #${tag} — ${tagCounts[tag]} tasks
              </div>
              <div class="warning-details hidden">${relatedTasks}</div>
            </div>
          `;
        })
        .join("")
    : `<p class="warning-item clear"><span class="warning-icon">✅</span> No overloaded tags!</p>`;

  document.getElementById("overloaded-tag-list").innerHTML = tagHTML;

  // ✨ Interaction: Toggle visibility on click
  document.querySelectorAll(".warning-item-summary").forEach((summary) => {
    summary.addEventListener("click", () => {
      const next = summary.nextElementSibling;
      if (next) next.classList.toggle("hidden");
    });
  });

  document.querySelectorAll(".nested-task-summary").forEach((task) => {
    task.addEventListener("click", () => {
      const next = task.nextElementSibling;
      if (next) next.classList.toggle("hidden");
    });
  });

  document.querySelectorAll(".extend-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const taskText = btn.dataset.text;

      // Hide the specific warning container
      const warningItem = btn.closest(".warning-item");
      if (warningItem) warningItem.remove();

      // Update due date and refresh the board
      extendDueDate(taskText);
    });
  });
}

function extendDueDate(taskText) {
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

function renderPriorityTrends() {
  const trends = JSON.parse(localStorage.getItem("kanbaTrends")) || [];

  const labels = trends.map((t) => t.date);
  const lowData = trends.map((t) => t.low || 0);
  const mediumData = trends.map((t) => t.medium || 0);
  const highData = trends.map((t) => t.high || 0);

  const ctx = document.getElementById("priorityTrendChart").getContext("2d");
  if (window.priorityTrendChart instanceof Chart) {
    window.priorityTrendChart.destroy();
  }

  window.priorityTrendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Low Priority",
          data: lowData,
          backgroundColor: "rgba(144, 238, 144, 0.5)",
          borderColor: "green",
          fill: true,
          stack: "priorities",
        },
        {
          label: "Medium Priority",
          data: mediumData,
          backgroundColor: "rgba(255, 215, 0, 0.5)",
          borderColor: "goldenrod",
          fill: true,
          stack: "priorities",
        },
        {
          label: "High Priority",
          data: highData,
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "red",
          fill: true,
          stack: "priorities",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Task Priorities Over Time",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Task Count" },
        },
        x: {
          title: { display: true, text: "Date" },
        },
      },
    },
  });
}

function renderCompletionByTag() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];
  const completedTasks = tasks.filter((t) => t.status === "done" && t.completedAt);

  const tagMap = {};

  completedTasks.forEach((task) => {
    const tags = (task.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const added = new Date(task.dateAdded);
    const completed = new Date(task.completedAt);
    const duration = (completed - added) / (1000 * 60 * 60 * 24);

    tags.forEach((tag) => {
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(duration);
    });
  });

  const labels = Object.keys(tagMap);
  const data = labels.map((tag) => {
    const durations = tagMap[tag];
    return (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2);
  });

  const ctx = document.getElementById("completionRateByTagChart").getContext("2d");
  if (window.completionByTagChart instanceof Chart) window.completionByTagChart.destroy();

  window.completionByTagChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels.map((tag) => `#${tag}`),
      datasets: [
        {
          label: "Avg Completion Time (Days)",
          data,
          backgroundColor: labels.map((tag) => stringToColor(tag)),
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "Completion Time by Tag",
        },
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Days" },
        },
      },
    },
  });
}

function exportToPDF(targetElement, filename = "kanba-report.pdf") {
  const opt = {
    margin: 0.5,
    filename: filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };

  html2pdf().set(opt).from(targetElement).save();
}

document.getElementById("export-pdf-full").addEventListener("click", () => {
  const fullPanel = document.getElementById("analytics-content");

  // Temporarily unhide all tabs
  const hiddenTabs = document.querySelectorAll(".analytics-tab.hidden");
  hiddenTabs.forEach((tab) => tab.classList.remove("hidden"));

  // Give time for layout to reflow before exporting
  setTimeout(() => {
    exportToPDF(fullPanel, "kanba-full-report.pdf");

    // Re-hide the tabs after export
    hiddenTabs.forEach((tab) => tab.classList.add("hidden"));
  }, 300); // slight delay ensures accurate rendering
});

document.getElementById("export-pdf-current").addEventListener("click", () => {
  const currentTab = document.querySelector(".analytics-tab:not(.hidden)");
  if (currentTab) {
    exportToPDF(currentTab, "kanba-current-tab.pdf");
  } else {
    alert("No active tab found.");
  }
});

document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
    document.querySelectorAll(".analytics-tab").forEach((tab) => tab.classList.add("hidden"));

    button.classList.add("active");
    const tabId = "tab-" + button.dataset.tab;
    document.getElementById(tabId).classList.remove("hidden");

    // Render charts only when needed
    if (tabId === "tab-overview") renderAnalyticsChart();
    if (tabId === "tab-trends") renderTrendChart();
    if (tabId === "tab-tags") renderTagChart();
    if (tabId === "tab-insights") {
      renderInsights();
      renderCompletionChart();
      renderPriorityTrends();
      renderCompletionByTag();
    }
    if (tabId === "tab-warnings") renderWarnings();
  });
});

window.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("kanbaSimulated")) {
    simulateFakeTasksWithTags();
    simulateWarningsData();
    simulateFakeTrendData();
    simulateInsightsData();
    simulatePriorityTrends();
    simulateTagCompletionData();
    simIcon.classList.remove("fa-toggle-off");
    simIcon.classList.add("fa-toggle-on");
  } else {
    simIcon.classList.remove("fa-toggle-on");
    simIcon.classList.add("fa-toggle-off");
  }

  // 🟩 Toggle click listener
  simToggle.addEventListener("click", () => {
    const isSimOn = localStorage.getItem("kanbaSimulated");

    if (isSimOn) {
      // 🔻 Turn OFF simulation
      localStorage.removeItem("kanbaSimulated");
      localStorage.removeItem("kanbaTasks");
      simIcon.classList.remove("fa-toggle-on");
      simIcon.classList.add("fa-toggle-off");

      showTask(); // Re-render empty/real data
      renderWarnings();
      updateNotifications();
      // (Optional) clear charts too if needed
    } else {
      // 🔺 Turn ON simulation
      simulateFakeTasksWithTags();
      simulateWarningsData();
      simulateFakeTrendData();
      simulateInsightsData();
      simulatePriorityTrends();
      simulateTagCompletionData();

      localStorage.setItem("kanbaSimulated", "true");
      simIcon.classList.remove("fa-toggle-off");
      simIcon.classList.add("fa-toggle-on");

      showTask(); // Re-render with simulated data
      renderWarnings();
      updateNotifications();
    }
  });

  saveDailySnapshot();
  document.getElementById("export-csv-btn").addEventListener("click", exportTasksToCSV);
});

document.getElementById("currentYear").textContent = new Date().getFullYear();

// Initial load
showTask();
updateNotifications();
