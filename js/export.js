// Export task list as CSV
export function exportTasksToCSV() {
  const tasks = JSON.parse(localStorage.getItem("kanbaTasks")) || [];

  if (!tasks.length) {
    alert("No tasks to export.");
    return;
  }

  const headers = ["Text", "Description", "Priority", "Due Date", "Checked", "Date Added", "Created At", "Updated At", "Completed At", "Status", "Tags"];

  const rows = tasks.map((task) => [
    `"${task.text}"`,
    `"${task.description || ""}"`,
    `"${task.priority || ""}"`,
    `"${task.duedate || ""}"`,
    task.checked,
    `"${task.dateAdded || ""}"`,
    `"${task.createdAt || ""}"`,
    `"${task.updatedAt || ""}"`,
    `"${task.completedAt || ""}"`,
    `"${task.status || ""}"`,
    `"${task.tags || ""}"`,
  ]);

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

// Download chart image
export function downloadChartImage(chartId) {
  const canvas = document.getElementById(chartId);
  const link = document.createElement("a");
  link.download = `${chartId}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// Export element as PDF using html2pdf
export function exportToPDF(targetElement, filename = "kanba-report.pdf") {
  const opt = {
    margin: 0.5,
    filename: filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
  };

  html2pdf().set(opt).from(targetElement).save();
}
