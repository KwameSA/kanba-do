const inputBox = document.getElementById("input-box");
const errorMessage = document.getElementById("error-message");
const sortOptions = document.getElementById("sort-options");

const containers = {
  do: document.getElementById("do-container"),
  doing: document.getElementById("doing-container"),
  done: document.getElementById("done-container"),
};

function addEntry() {
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

  if (status === "do") {
    const deleteButton = document.createElement("span");
    deleteButton.innerHTML = "\u00d7";
    deleteButton.classList.add("delete");
    deleteButton.onclick = () => {
      li.remove();
      saveTask();
    };
    li.appendChild(deleteButton);
  }

  if (status !== "done") {
    const moveBackButton = document.createElement("span");
    moveBackButton.innerHTML = "-";
    moveBackButton.onclick = () => moveTaskBackward(li);
    li.appendChild(moveBackButton);
  }

  li.onclick = () => {
    const currentStatus = li.dataset.status;

    li.classList.toggle("checked");

    if (li.classList.contains("checked")) {
      moveTaskForward(li);
    } else {
      moveTaskBackward(li);
    }
    saveTask();
  };

  return li;
}

function moveTaskForward(task) {
  const status = task.dataset.status;
  const span = task.querySelector("span");
  const deleteButton = task.querySelector(".delete");

  if (status === "do") {
    containers.doing.appendChild(task);
    task.dataset.status = "doing";

    if (deleteButton) {
      deleteButton.remove();
    }

    const moveBackButton = document.createElement("span");
    moveBackButton.innerHTML = "-";
    moveBackButton.onclick = () => moveTaskBackward(task);

    task.appendChild(moveBackButton);
  } else if (status === "doing") {
    containers.done.appendChild(task);
    task.dataset.status = "done";
    span.remove();

    const moveBackButton = task.querySelector("span");

    if (moveBackButton) {
      moveBackButton.remove();
    }
  }
}

function moveTaskBackward(task) {
  const status = task.dataset.status;
  const span = task.querySelector("span");

  if (status === "done") {
    containers.doing.appendChild(task);
    task.dataset.status = "doing";

    const moveBackButton = document.createElement("span");
    moveBackButton.innerHTML = "-";
    moveBackButton.onclick = () => moveTaskBackward(task);
    task.appendChild(moveBackButton);
  } else if (status === "doing") {
    containers.do.appendChild(task);
    task.dataset.status = "do";

    task.classList.remove("checked");
    task.dataset.checked = "false";

    const deleteButton = document.createElement("span");
    deleteButton.innerHTML = "\u00d7";
    deleteButton.onclick = () => {
      task.remove();
      saveTask();
    };
    task.appendChild(deleteButton);
  }
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

function sortTasks(criteria) {
  const tasks = Array.from(containers.do.children).concat(Array.from(containers.doing.children), Array.from(containers.done.children));

  if (criteria === "alphabetical") {
    tasks.sort((a, b) => a.textContent.localeCompare(b.textContent));
  } else if (criteria === "checked") {
    tasks.sort((a, b) => a.dataset.checked.localeCompare(b.dataset.checked));
  } else if (criteria === "date") {
    tasks.sort((a, b) => new Date(a.dataset.dateAdded) - new Date(b.dataset.dateAdded));
  }

  containers.do.innerHTML = "";
  containers.doing.innerHTML = "";
  containers.done.innerHTML = "";

  tasks.forEach((task) => {
    if (task.dataset.status === "do") {
      containers.do.appendChild(task);
    } else if (task.dataset.status === "doing") {
      containers.doing.appendChild(task);
    } else if (task.dataset.status === "done") {
      containers.done.appendChild(task);
    }
  });
}

sortOptions.addEventListener("change", function () {
  sortTasks(sortOptions.value);
});

containers.do.addEventListener("click", function (e) {
  if (e.target.tagName === "LI") {
    e.target.classList.toggle("checked");
    e.target.dataset.checked = e.target.classList.contains("checked") ? "true" : "false";
    saveTask();
  } else if (e.target.tagName === "SPAN") {
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
      text: li.textContent.replace("\u00d7", "").trim(),
      checked: li.classList.contains("checked"),
      dateAdded: li.dataset.dateAdded,
    })),
    doing: Array.from(containers.doing.children).map((li) => ({
      text: li.textContent.replace("\u00d7", "").replace("-", "").trim(),
      checked: li.classList.contains("checked"),
      dateAdded: li.dataset.dateAdded,
    })),
    done: Array.from(containers.done.children).map((li) => ({
      text: li.textContent.replace("\u00d7", "").trim(),
      checked: li.classList.contains("checked"),
      dateAdded: li.dataset.dateAdded,
    })),
  };
  localStorage.setItem("kanbaTasks", JSON.stringify(tasks));
}

function showTask() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || { do: [], doing: [], done: [] };

  containers.do.innerHTML = "";
  containers.doing.innerHTML = "";
  containers.done.innerHTML = "";

  tasks.do.forEach((task) => {
    const li = createTaskElement(task.text, "do");
    li.dataset.dateAdded = task.dateAdded || new Date().toISOString();
    li.dataset.checked = task.checked ? "true" : "false";
    if (task.checked) li.classList.add("checked");
    containers.do.appendChild(li);
  });

  tasks.doing.forEach((task) => {
    const li = createTaskElement(task.text, "doing");
    li.dataset.dateAdded = task.dateAdded || new Date().toISOString();
    li.dataset.checked = task.checked ? "true" : "false";
    if (task.checked) li.classList.add("checked");
    containers.doing.appendChild(li);
  });

  tasks.done.forEach((task) => {
    const li = createTaskElement(task.text, "done");
    li.dataset.dateAdded = task.dateAdded || new Date().toISOString();
    li.dataset.checked = task.checked ? "true" : "false";
    if (task.checked) li.classList.add("checked");
    containers.done.appendChild(li);
  });
}

showTask();

inputBox.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    addEntry();
  }
});

containers.do.addEventListener("dblclick", function (e) {
  if (e.target.tagName === "LI") {
    const originalText = e.target.firstChild.textContent;
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalText.trim();
    e.target.firstChild.replaceWith(input);

    input.addEventListener("blur", function () {
      const updatedText = input.value.trim();
      e.target.innerHTML = updatedText || originalText;

      const span = document.createElement("span");
      span.innerHTML = "\u00d7";
      e.target.appendChild(span);

      saveTask();
    });

    input.addEventListener("keydown", function (eKey) {
      if (eKey.key === "Enter") {
        const updatedText = input.value.trim();
        e.target.innerHTML = updatedText || originalText;
        saveTask();
      }
    });

    input.focus();
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

// The following code facilitates the moving between the sections
document.querySelectorAll("button[data-target]").forEach((button) => {
  button.addEventListener("click", function () {
    const targetSection = button.dataset.target;

    document.querySelectorAll(".todo-app, .todoing-app, .todone-app").forEach((section) => {
      section.style.display = "none";
    });

    document.querySelector(`.${targetSection}`).style.display = "block";
  });
});

function clearTasks() {
  localStorage.removeItem("kanbaTasks");

  containers.do.innerHTML = "";
  containers.done.innerHTML = "";
  containers.doing.innerHTML = "";
}

document.getElementById("clearTasksBtn").addEventListener("click", clearTasks);
