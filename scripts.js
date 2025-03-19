const inputBox = document.getElementById("input-box");
const errorMessage = document.getElementById("error-message");
const sortOptionsDo = document.getElementById("sort-options-do");
const sortOptionsDone = document.getElementById("sort-options-done");
const searchStatus = document.getElementById("search-status");
const taskModal = document.getElementById("taskModal");
const closeModal = document.getElementById("closeModal");
const saveModal = document.getElementById("saveModal");
const cancelModal = document.getElementById("cancelModal");
const modalTaskName = document.getElementById("modalTaskName");
const modalTaskDescription = document.getElementById("modalTaskDescription");
const modalTaskPriority = document.getElementById("modalTaskPriority");

let currentSection = "do";
let currentTaskElement = null;

const containers = {
  do: document.getElementById("do-container"),
  doing: document.getElementById("doing-container"),
  done: document.getElementById("done-container"),
};

// The following code facilitates the moving between the sections
document.querySelectorAll("button[data-target]").forEach((button) => {
  button.addEventListener("click", function () {
    const targetSection = button.dataset.target;

    if (targetSection === "todo-app") {
      currentSection = "do";
    } else if (targetSection === "todoing-app") {
      currentSection = "doing";
    } else {
      currentSection = "done";
    }

    document.querySelectorAll(".todo-app, .todoing-app, .todone-app").forEach((section) => {
      section.style.display = "none";
    });

    document.querySelector(`.${targetSection}`).style.display = "block";
  });
});

function addEntry() {
  const congratsElement = document.getElementById("congratulations");

  congratsElement.style.display = "none";

  const taskText = inputBox.value.trim();

  if (!taskText) {
    showError("Enter something to be accomplished!!");
    return;
  }

  const existingTasks = Array.from(containers.do.children).map((li) => li.textContent.trim().toLowerCase());

  if (existingTasks.includes(taskText.toLowerCase())) {
    showError("Task already exists!! Is there anything else?");
    return;
  }

  errorMessage.style.display = "none";

  const li = createTaskElement(taskText, "do");
  containers.do.appendChild(li);

  inputBox.value = "";

  saveTask();
}

function createTaskElement(text, status) {
  const li = document.createElement("li");
  li.draggable = true;
  li.textContent = text;
  li.dataset.status = status;

  let deleteButton, moveBackButton;

  deleteButton = document.createElement("span");
  deleteButton.innerHTML = "\u00d7";
  deleteButton.classList.add("delete");
  deleteButton.onclick = () => {
    li.remove();
    saveTask();
  };
  li.appendChild(deleteButton);

  moveBackButton = document.createElement("span");
  moveBackButton.innerHTML = "-";
  moveBackButton.classList.add("move");
  moveBackButton.onclick = () => moveTaskBackward(li);

  li.appendChild(moveBackButton);

  if (status === "do") {
    moveBackButton.style.display = "none";
  }

  if (status === "doing") {
    moveBackButton.style.display = "inline";
  }

  if (status === "done") {
    moveBackButton.style.display = "none";
  }

  const moveButtonDiv = document.createElement("div");
  moveButtonDiv.classList.add("move-btn");

  moveButtonDiv.addEventListener("click", (e) => {
    e.stopPropagation();
    const currentStatus = li.dataset.status;

    if (currentStatus === "do" || currentStatus === "doing") {
      li.classList.add("checked");
      moveTaskForward(li);
    } else {
      li.classList.remove("checked");
      moveTaskBackward(li);
    }
    saveTask();
  });

  li.appendChild(moveButtonDiv);
  return li;
}

function moveTaskForward(task) {
  const status = task.dataset.status;
  const deleteButton = task.querySelector(".delete");
  const moveBackButton = task.querySelector(".move");

  if (status === "do") {
    containers.doing.appendChild(task);
    task.dataset.status = "doing";

    if (deleteButton) {
      deleteButton.style.display = "none";
    }

    if (moveBackButton) {
      moveBackButton.style.display = "inline";
    }

    task.classList.remove("checked");
    task.dataset.checked = "false";
  } else if (status === "doing") {
    containers.done.appendChild(task);
    task.dataset.status = "done";

    if (deleteButton) {
      deleteButton.style.display = "none";
    }

    if (moveBackButton) {
      moveBackButton.style.display = "none";
    }
  }
  checkCompletion();
}

function moveTaskBackward(task) {
  const status = task.dataset.status;
  const deleteButton = task.querySelector(".delete");
  const moveBackButton = task.querySelector(".move");

  if (status === "done") {
    containers.doing.appendChild(task);
    task.dataset.status = "doing";

    if (deleteButton) {
      deleteButton.style.display = "none";
    }

    if (moveBackButton) {
      moveBackButton.style.display = "inline";
    }
  } else if (status === "doing") {
    containers.do.appendChild(task);
    task.dataset.status = "do";

    task.classList.remove("checked");
    task.dataset.checked = "false";

    if (deleteButton) {
      deleteButton.style.display = "inline";
    }

    if (moveBackButton) {
      moveBackButton.style.display = "none";
    }
  }

  checkCompletion();
}

function addEventListenerForButtons() {
  containers.doing.addEventListener("click", function (e) {
    if (e.target.tagName === "SPAN" && e.target.innerHTML === "-") {
      const task = e.target.parentElement;
      moveTaskBackward(task);
      saveTask();
    }
  });
}

addEventListenerForButtons();

function sortTasks(criteria, section) {
  const tasks = Array.from(containers[section].children);
  if (criteria === "alphabetical") {
    tasks.sort((a, b) => a.textContent.localeCompare(b.textContent));
  } else if (criteria === "checked") {
    tasks.sort((a, b) => a.dataset.checked.localeCompare(b.dataset.checked));
  } else if (criteria === "date") {
    tasks.sort((a, b) => new Date(a.dataset.dateAdded) - new Date(b.dataset.dateAdded));
  }

  containers[section].innerHTML = "";

  tasks.forEach((task) => containers[section].appendChild(task));
}

sortOptionsDo.addEventListener("change", function () {
  sortTasks(sortOptionsDo.value, "do");
});

sortOptionsDone.addEventListener("change", function () {
  sortTasks(sortOptionsDone.value, "done");
});

containers.do.addEventListener("click", function (e) {
  if (e.target.tagName === "SPAN") {
    e.target.parentElement.remove();
    saveTask();
  }
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
  errorMessage.style.animation = "none";

  setTimeout(() => {
    errorMessage.style.animation = "vibrate 0.3s";
  }, 0);

  setTimeout(() => {
    errorMessage.style.display = "none";
  }, 3000);
}

function saveTask() {
  const tasks = {
    do: Array.from(containers.do.children).map((li) => ({
      text: li.textContent.replace(/[×-]/g, "").trim(),
      checked: li.classList.contains("checked"),
      dateAdded: li.dataset.dateAdded,
      priority: li.dataset.priority || "low",
    })),
    doing: Array.from(containers.doing.children).map((li) => ({
      text: li.textContent.replace(/[×-]/g, "").trim(),
      checked: li.classList.contains("checked"),
      dateAdded: li.dataset.dateAdded,
      priority: li.dataset.priority || "low",
    })),
    done: Array.from(containers.done.children).map((li) => ({
      text: li.textContent.replace(/[×-]/g, "").trim(),
      checked: li.classList.contains("checked"),
      dateAdded: li.dataset.dateAdded,
      priority: li.dataset.priority || "low",
    })),
  };

  localStorage.setItem("kanbaTasks", JSON.stringify(tasks));
}

// MODAL FUNCTIONALITY
containers.do.addEventListener("dblclick", function (e) {
  if (e.target.tagName === "LI" && !e.target.isEditing) {
    currentTaskElement = e.target;
    modalTaskName.value = e.target.firstChild.textContent.trim();
    modalTaskDescription.value = "";
    taskModal.style.display = "flex";
  }
});

cancelModal.addEventListener("click", function () {
  taskModal.style.display = "none";
});

saveModal.addEventListener("click", function () {
  if (currentTaskElement) {
    currentTaskElement.firstChild.textContent = modalTaskName.value.trim();

    currentTaskElement.dataset.description = modalTaskDescription.value.trim();

    currentTaskElement.dataset.priority = modalTaskPriority.value;

    currentTaskElement.setAttribute("data-priority", modalTaskPriority.value);

    saveTask();
  }
  taskModal.style.display = "none";
});

function showTask() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || { do: [], doing: [], done: [] };

  containers.do.innerHTML = "";
  containers.doing.innerHTML = "";
  containers.done.innerHTML = "";

  tasks.do.forEach((task) => {
    const li = createTaskElement(task.text, "do");
    li.dataset.dateAdded = task.dateAdded || new Date().toISOString();
    li.dataset.priority = task.priority || "low";
    li.dataset.checked = task.checked ? "true" : "false";

    if (task.checked) li.classList.add("checked");
    containers.do.appendChild(li);
  });

  tasks.doing.forEach((task) => {
    const li = createTaskElement(task.text, "doing");
    li.dataset.dateAdded = task.dateAdded || new Date().toISOString();
    li.dataset.priority = task.priority || "low";
    li.dataset.checked = task.checked ? "true" : "false";

    if (task.checked) li.classList.add("checked");
    containers.doing.appendChild(li);
  });

  tasks.done.forEach((task) => {
    const li = createTaskElement(task.text, "done");
    li.dataset.dateAdded = task.dateAdded || new Date().toISOString();
    li.dataset.priority = task.priority || "low";
    li.dataset.checked = task.checked ? "true" : "false";

    if (task.checked) li.classList.add("checked");
    containers.done.appendChild(li);
  });

  updateDeleteButtonVisibility();
}

showTask();

function updateDeleteButtonVisibility() {
  containers.do.querySelectorAll("li").forEach((li) => {
    const deleteButton = li.querySelector(".delete");
    if (li.dataset.status === "do") {
      deleteButton.style.display = "inline";
    }
  });

  containers.doing.querySelectorAll("li").forEach((li) => {
    const deleteButton = li.querySelector(".delete");
    deleteButton.style.display = "none";
  });

  containers.done.querySelectorAll("li").forEach((li) => {
    const deleteButton = li.querySelector(".delete");
    deleteButton.style.display = "none";
  });
}

inputBox.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    addEntry();
  }
});

containers.do.addEventListener("dragstart", function (e) {
  if (e.target.tagName === "LI") {
    e.target.classList.add("dragging");
  }
});

containers.do.addEventListener("dragover", function (e) {
  e.preventDefault();

  const dragging = document.querySelector(".dragging");
  const afterElement = getDragAfterElement(containers.do, e.clientY);

  if (!afterElement) {
    containers.do.appendChild(dragging);
  } else {
    containers.do.insertBefore(dragging, afterElement);
  }
});

containers.do.addEventListener("dragend", function (e) {
  e.target.classList.remove("dragging");
  containers.do.appendChild(e.target);
  saveTask();
});

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];

  return draggableElements.reduce(
    (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}

function clearTasks() {
  localStorage.removeItem("kanbaTasks");

  containers.do.innerHTML = "";
  containers.done.innerHTML = "";
  containers.doing.innerHTML = "";
}

function checkCompletion() {
  const doContainer = containers.do;
  const doingContainer = containers.doing;
  const congratsElement = document.getElementById("congratulations");

  const messages = [
    "Amazing! You've tackled everything on your plate!",
    "Outstanding! Task list cleared like a champ!",
    "Bravo! All tasks have been conquered!",
    "Great job! You’ve crossed the finish line!",
    "Fantastic! No more tasks, time to celebrate!",
    "Mission accomplished! What a pro!",
    "You’re on fire! Every task is done!",
    "Boom! All tasks obliterated!",
    "Victory is yours! Nothing left to do!",
    "Cheers to your productivity!",
    "Kudos! You’re officially task-free!",
    "You’ve earned a break—awesome job!",
    "You're a rockstar! No tasks left behind!",
    "Legendary performance! All clear!",
    "Amazing effort! Everything is checked off!",
    "Fantastic work! You’ve aced it all!",
    "Done and dusted! Time to relax.",
    "Woohoo! Everything is complete!",
    "Epic win! Your list is empty!",
    "Incredible! You’ve achieved task-zero!",
    "You’re unstoppable! No tasks remain!",
    "Congratulations! You’ve mastered productivity!",
    "What a superstar! Tasks cleared effortlessly.",
    "Impressive! You’ve knocked it out of the park!",
    "All done? You’re officially amazing!",
    "Gold medal for productivity goes to you!",
    "Bravo! Task-free zone achieved!",
    "Excellence at its best! Great job!",
    "You’re a legend! Mission complete.",
    "Smashing success! Your list is history!",
    "Phenomenal! Tasks cleared in style!",
    "Outstanding effort! Nothing left undone.",
    "Mic drop! You’ve done it all.",
    "Unstoppable force! List zero achieved.",
    "You’ve crushed it! Every task is history.",
    "Hats off! Your tasks have been obliterated!",
    "Round of applause! Task-free life achieved.",
    "You're a wizard of productivity!",
    "Perfection achieved! Tasks are gone.",
    "High five! Your list is history.",
    "You're the boss! Task-free status unlocked.",
    "Masterclass in productivity! Everything’s done.",
  ];

  if (doingContainer.children.length === 0 && doContainer.children.length === 0) {
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    congratsElement.textContent = randomMessage;
    document.getElementById("congratulations").style.display = "block";
  } else {
    document.getElementById("congratulations").style.display = "none";
  }
}

document.getElementById("clearTasksBtn").addEventListener("click", function () {
  clearTasks();
  document.getElementById("congratulations").style.display = "none";
});

// Search functionality
searchStatus.addEventListener("input", function () {
  const searchValue = searchStatus.value.toLowerCase();

  let tasks;

  if (currentSection === "do") {
    tasks = containers.do.getElementsByTagName("li");
  } else if (currentSection === "doing") {
    tasks = containers.doing.getElementsByTagName("li");
  } else {
    tasks = containers.done.getElementsByTagName("li");
  }

  Array.from(tasks).forEach((task) => {
    const taskText = task.firstChild.textContent.toLowerCase();
    if (taskText.includes(searchValue)) {
      task.style.display = "";
    } else {
      task.style.display = "none";
    }
  });
});

containers.do.addEventListener("click", function (e) {
  if (e.target.classList.contains("delete") || e.target.classList.contains("move") || e.target.classList.contains("move-btn")) {
    return;
  }

  if (e.target.tagName === "LI" || e.target.parentElement.tagName === "LI") {
    currentTaskElement = e.target.closest("li");
    modalTaskName.value = currentTaskElement.firstChild.textContent.trim();
    modalTaskPriority.value = e.target.dataset.priority || "low";
    modalTaskDescription.value = "";
    taskModal.style.display = "flex";
  }
});
