document.addEventListener("DOMContentLoaded", function () {
  const inputBox = document.getElementById("input-box");
  const errorMessage = document.getElementById("error-message");
  const sortOptions = document.getElementById("sort-options");
  const sortOptionsDoing = document.getElementById("sort-options-doing");
  const sortOptionsDone = document.getElementById("sort-options-done");

  const containers = {
    do: document.querySelector(".todo-app ul"),
    doing: document.querySelector(".todoing-app ul"),
    done: document.querySelector(".todone-app ul"),
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

    const deleteButton = document.createElement("span");
    deleteButton.innerHTML = status === "do" ? "\u00d7" : "-";
    deleteButton.onclick = (e) => {
      e.stopPropagation();
      if (status === "do") {
        li.remove();
      } else {
        moveTaskBackward(li);
        console.log("No action");
      }
      saveTask();
    };
    li.appendChild(deleteButton);

    if (status === "doing") {
      const backButton = document.createElement("span");
      backButton.innerHTML = "-";
      backButton.onclick = (e) => {
        e.stopPropagation();
        moveTaskBackward(li);
      };
      li.appendChild(backButton);
    }

    li.onclick = (e) => {
      if (e.target.tagName !== "SPAN") {
        li.classList.toggle("checked");

        if (li.classList.contains("checked")) {
          moveTaskForward(li);
        } else {
          moveTaskBackward(li);
        }
        saveTask();
      }
    };

    return li;
  }

  function moveTaskForward(task) {
    const status = task.dataset.status;
    const span = task.querySelector("span");

    if (status === "do") {
      containers.doing.appendChild(task);
      task.dataset.status = "doing";
      span.innerHTML = "-";
    } else if (status === "doing") {
      containers.done.appendChild(task);
      task.dataset.status = "done";
      span.remove();
    }
  }

  function moveTaskBackward(task) {
    const status = task.dataset.status;

    if (status === "done") {
      containers.doing.appendChild(task);
      task.dataset.status = "doing";

      let span = task.querySelector("span");
      if (!span) {
        span = document.createElement("span");
        span.innerHTML = "-";
        span.onclick = () => moveTaskBackward(task);
        task.appendChild(span);
      } else {
        span.innerHTML = "-";
      }
    } else if (status === "doing") {
      containers.do.appendChild(task);
      task.dataset.status = "do";

      const span = task.querySelector("span");
      if (span) {
        span.innerHTML = "\u00d7";
      }
    }
  }

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

  function renderTasks(sortedTasks) {
    containers.do.innerHTML = "";
    containers.doing.innerHTML = "";
    containers.done.innerHTML = "";

    sortedTasks.forEach((task) => {
      const container = containers[task.dataset.status];
      if (container) container.appendChild(task);
    });
  }

  sortOptions.addEventListener("change", function () {
    sortTasks(sortOptions.value);
  });

  sortOptionsDoing.addEventListener("change", function () {
    sortTasks(sortOptionsDoing.value);
  });

  sortOptionsDone.addEventListener("change", function () {
    sortTasks(sortOptionsDone.value);
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
  }

  function saveTask() {
    const tasks = {
      do: Array.from(containers.do.children).map((li) => ({
        text: li.firstChild.textContent.trim(),
        checked: li.classList.contains("checked"),
        dateAdded: li.dataset.dateAdded,
        status: li.dataset.status,
      })),
      doing: Array.from(containers.doing.children).map((li) => ({
        text: li.firstChild.textContent.trim(),
        checked: li.classList.contains("checked"),
        dateAdded: li.dataset.dateAdded,
        status: li.dataset.status,
      })),
      done: Array.from(containers.done.children).map((li) => ({
        text: li.firstChild.textContent.trim(),
        checked: li.classList.contains("checked"),
        dateAdded: li.dataset.dateAdded,
        status: li.dataset.status,
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

  // The following lines of code allows tasks to be edited

  containers.do.addEventListener("dblclick", function (e) {
    if (e.target.tagName === "LI") {
      const originalText = e.target.firstChild.textContent.trim();
      const input = document.createElement("input");
      input.type = "text";
      input.value = originalText;
      e.target.firstChild.replaceWith(input);
      e.target.innerHTML = "";
      e.target.appendChild(input);

      input.addEventListener("blur", function () {
        const updatedText = input.value.trim();
        if (updatedText) {
          e.target.innerHTML = updatedText;
        } else {
          e.target.innerHTML = originalText;
        }

        const span = document.createElement("span");
        span.innerHTML = "\u00d7";
        e.target.appendChild(span);

        saveTask();
      });

      input.addEventListener("keydown", function (eKey) {
        if (eKey.key === "Enter") {
          const updatedText = input.value.trim();
          if (updatedText) {
            e.target.innerHTML = updatedText;
          } else {
            e.target.innerHTML = originalText;
          }
          saveTask();
        }
      });

      input.focus();
    }
  });

  [containers.do, containers.doing, containers.done].forEach((container) => {
    container.addEventListener("dragstart", function (e) {
      if (e.target.tagName === "LI") {
        e.target.classList.add("dragging");
      }
    });

    container.addEventListener("dragend", function (e) {
      e.target.classList.remove("dragging");
      container.appendChild(e.target);
      saveTask();
    });

    container.addEventListener("dragover", function (e) {
      e.preventDefault();

      const dragging = document.querySelector(".dragging");
      const afterElement = getDragAfterElement(container, e.clientY);

      if (!afterElement) {
        container.appendChild(dragging);
      } else {
        container.insertBefore(dragging, afterElement);
      }
    });
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

  document.getElementById("clearTasksBtn").addEventListener("click", clearTasks);

  // The following lines of code clears the local storage and allows a fresh start

  function clearTasks() {
    localStorage.removeItem("kanbaTasks");

    containers.do.innerHTML = "";
    containers.done.innerHTML = "";
    containers.doing.innerHTML = "";
  }
});
