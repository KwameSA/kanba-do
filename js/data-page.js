import { initCommon } from "./page-common.js";

function bindImportExport() {
  const importButton = document.getElementById("import-btn");
  const importFile = document.getElementById("import-file");
  const exportButton = document.getElementById("export-btn");

  if (importButton) {
    importButton.addEventListener("click", () => {
      const text = document.getElementById("import-textarea").value.trim();
      try {
        const tasks = JSON.parse(text);
        localStorage.setItem("kanbaTasks", JSON.stringify(tasks));
        document.getElementById("import-status").textContent = "Tasks imported successfully!";
      } catch (err) {
        document.getElementById("import-status").textContent = "Invalid JSON.";
      }
    });
  }

  if (importFile) {
    importFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const fileName = document.getElementById("file-name");
      if (fileName) {
        fileName.textContent = file ? file.name : "No file chosen";
      }
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const tasks = JSON.parse(event.target.result);
          localStorage.setItem("kanbaTasks", JSON.stringify(tasks));
          document.getElementById("import-status").textContent = "Tasks imported successfully!";
        } catch (err) {
          document.getElementById("import-status").textContent = "Invalid file.";
        }
      };
      reader.readAsText(file);
    });
  }

  if (exportButton) {
    exportButton.addEventListener("click", () => {
      const data = localStorage.getItem("kanbaTasks");
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "kanba_tasks_backup.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initCommon();
  bindImportExport();
});
