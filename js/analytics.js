import { stringToColor } from "./utils.js";
import { extendDueDate } from "./tasks.js";
import { translations } from "./dictionary.js";
import { readTasksFromStorage } from "./task-model.js";

function getChartTheme() {
  const textColor = getComputedStyle(document.body).getPropertyValue("--text-color").trim() || "#fff";
  const gridColor = getComputedStyle(document.body).getPropertyValue("--border-color").trim() || "rgba(255,255,255,0.2)";
  return { textColor, gridColor };
}

function renderAnalyticsChart() {
  const tasks = readTasksFromStorage();

  const counts = { do: 0, doing: 0, done: 0 };
  tasks.forEach((task) => {
    if (counts[task.status] !== undefined) counts[task.status]++;
  });

  // @ts-ignore
  const ctx = document.getElementById("statusChart").getContext("2d");
  if (window.statusChart instanceof Chart) {
    window.statusChart.destroy();
  }

  const { textColor, gridColor } = getChartTheme();

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
        legend: { display: false, labels: { color: textColor } },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Task Count", color: textColor },
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
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

  const { textColor, gridColor } = getChartTheme();

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
          labels: { color: textColor },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Number of Tasks",
            color: textColor,
          },
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
      },
    },
  });
}

function renderTagChart() {
  const ctx = document.getElementById("tagChart").getContext("2d");
  const tasks = readTasksFromStorage();

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

  const { textColor } = getChartTheme();

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
          labels: { color: textColor },
        },
      },
    },
  });
}

function renderInsights() {
  const tasks = readTasksFromStorage();
  const completedTasks = tasks.filter((t) => t.status === "done" && t.completedAt);

  const durations = completedTasks.map((t) => {
    const start = new Date(t.createdAt || t.dateAdded);
    const end = new Date(t.completedAt);
    return (end - start) / (1000 * 60 * 60 * 24); // in days
  });

  const avgTime = durations.length > 0 ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) : "N/A";

  document.getElementById("average-completion-text").innerHTML = `<strong>Average Task Completion Time:</strong> ${avgTime} days`;
}

function renderCompletionChart() {
  const tasks = readTasksFromStorage();
  const completed = tasks.filter((t) => t.status === "done" && t.completedAt);

  const dateMap = {};

  completed.forEach((t) => {
    const completeDate = new Date(t.completedAt).toISOString().split("T")[0];
    const added = new Date(t.createdAt || t.dateAdded);
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

  const { textColor, gridColor } = getChartTheme();

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
      plugins: {
        legend: { labels: { color: textColor } },
        tooltip: { titleColor: textColor, bodyColor: textColor },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Days",
            color: textColor,
          },
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
        x: {
          title: {
            display: true,
            text: "Completion Date",
            color: textColor,
          },
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
      },
    },
  });
}

function renderWarnings() {
  const lang = localStorage.getItem("kanbaLang") || "en";
  const t = (key, fallback = key) => translations?.[lang]?.[key] || fallback;
  const tasks = readTasksFromStorage();
  const today = new Date();

  const stagnantTasks = tasks.filter((task) => {
    if (task.status === "done") return false;
    const added = new Date(task.createdAt || task.dateAdded);
    const age = (today - added) / (1000 * 60 * 60 * 24);
    return age > 3;
  });

  const tagCounts = {};
  const tagTasksMap = {};

  tasks.forEach((task) => {
    (task.tags || "")
      .split(",")
      .map((tag) => tag.trim())
      .forEach((tag) => {
        if (!tag) return;
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        tagTasksMap[tag] = tagTasksMap[tag] || [];
        tagTasksMap[tag].push(task);
      });
  });

  const overloadedTags = Object.entries(tagCounts)
    .filter(([_, count]) => count >= 5)
    .map(([tag]) => tag);

  const stagnantHTML = stagnantTasks.length
    ? stagnantTasks
        .map(
          (task) => `
      <div class="warning-item">
        <div class="warning-item-summary" data-id="${task.id}">
          <span class="warning-icon">!</span> ${task.text} - ${t("stuck in", "stuck in")} ${task.status}
        </div>
        <div class="warning-details hidden">
          ${task.description || t("No description provided.", "No description provided.")}
          <br><br>
          <button class="extend-btn" data-text="${task.text}">${t("Extend by 3 days", "Extend by 3 days")}</button>
        </div>
      </div>
    `
        )
        .join("")
    : `<p class="warning-item clear"><span class="warning-icon">OK</span> ${t("No stagnant tasks found!", "No idle tasks need attention right now!")}</p>`;

  document.getElementById("stagnant-warning-list").innerHTML = stagnantHTML;

  const tagHTML = overloadedTags.length
    ? overloadedTags
        .map((tag) => {
          const relatedTasks = tagTasksMap[tag]
            .map(
              (task) => `
              <div class="nested-task">
                <span class="nested-task-summary">${task.text}</span>
                <div class="warning-details hidden">${task.description || t("No description provided.", "No description provided.")}</div>
              </div>
            `
            )
            .join("");

          return `
            <div class="warning-item">
              <div class="warning-item-summary" data-tag="${tag}">
                <span class="warning-icon">!</span> #${tag} - ${tagCounts[tag]} ${t("tasks", "tasks")}
              </div>
              <div class="warning-details hidden">${relatedTasks}</div>
            </div>
          `;
        })
        .join("")
    : `<p class="warning-item clear"><span class="warning-icon">OK</span> ${t("No overloaded tags!", "No overloaded tags!")}</p>`;

  document.getElementById("overloaded-tag-list").innerHTML = tagHTML;

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
    btn.addEventListener("click", () => {
      const taskText = btn.dataset.text;
      const warningItem = btn.closest(".warning-item");
      if (warningItem) warningItem.remove();
      extendDueDate(taskText);
    });
  });
}

function renderPriorityTrends() {
  const trends = JSON.parse(localStorage.getItem("kanbaTrends")) || [];

  const labels = trends.map((t) => t.date);
  const lowData = trends.map((t) => t.low || 0);
  const mediumData = trends.map((t) => t.medium || 0);
  const highData = trends.map((t) => t.high || 0);

  const ctx = document.getElementById("priorityTrendChart").getContext("2d");
  const { textColor, gridColor } = getChartTheme();

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
          color: textColor,
        },
        legend: { labels: { color: textColor } },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Task Count", color: textColor },
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
        x: { title: { display: true, text: "Date", color: textColor }, ticks: { color: textColor }, grid: { color: gridColor } },
      },
    },
  });
}

function renderCompletionByTag() {
  const tasks = readTasksFromStorage();
  const completedTasks = tasks.filter((t) => t.status === "done" && t.completedAt);

  const tagMap = {};

  completedTasks.forEach((task) => {
    const tags = (task.tags || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const added = new Date(task.createdAt || task.dateAdded);
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
  const { textColor, gridColor } = getChartTheme();

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
          color: textColor,
        },
        legend: { display: false, labels: { color: textColor } },
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Days", color: textColor },
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
        x: { ticks: { color: textColor }, grid: { color: gridColor } },
      },
    },
  });
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

export { renderAnalyticsChart, renderTrendChart, renderTagChart, renderInsights, renderCompletionChart, renderCompletionByTag, renderWarnings, renderPriorityTrends, renderOverdueTasks };
