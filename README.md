# Kanba-DO – Kanban Task Management App

**Kanba-DO** is an intuitive task management app designed with a clean Kanban-style interface. Built using HTML, CSS, and JavaScript (with Flask integration in progress), it helps users organize tasks across **To Do**, **Doing**, and **Done** columns — now with analytics, multilingual support, and a dynamic sidebar.

---

## 🚀 Features

### 🧩 Core Functionality
- **Add Tasks**: Create tasks directly in the "To Do" column.
- **Drag & Drop**: Rearrange tasks between columns with ease.
- **Click-to-Move**: Click a task to auto-advance its status.
- **Task Details**: Double-click a task to edit its contents.
- **Delete Tasks**: Use the delete icon (×) to remove tasks.
- **Persistent Storage**: Tasks are saved using `localStorage` to retain data across sessions.

### 📊 Productivity Insights
- **Task Analytics**: View task distribution trends across DO, DOING, and DONE using a line chart.
- **Progress Tracking**: Identify bottlenecks or spikes in productivity based on task flow.

### 🛎️ Notifications
- **Overdue Alerts**: View overdue tasks via a dedicated sidebar notification panel.
- **Smart Badge**: Sidebar icon displays real-time count of overdue items.

### 🌐 Multilingual Interface
- **Language Toggle**: Switch between English, Spanish, French, and Akan (Twi).
- **Dynamic UI**: All interface text is dynamically translated via `data-i18n` bindings.

### 🌙 UI Enhancements
- **Dark Mode Toggle**: Switch between light and dark themes.
- **Modular JS**: Clean, maintainable JavaScript modules for each feature.
- **Sidebar Navigation**: Access FAQ, language settings, insights, and notifications from a sleek sidebar.

### 🧹 Other Utilities
- **Sort Tasks**: Alphabetically, by status, or by date added.
- **Clear All**: One-click wipe of all tasks and local storage data.
- **FAQs**: Built-in guide for using the app effectively.

---

## 🛠️ Technologies Used

- **HTML, CSS, JavaScript** – Core app development
- **Web Storage API** – Local data persistence
- **Chart.js** – Interactive line chart for task insights
- **i18next** – Internationalization and language management
- **Font Awesome** – Icons for sidebar and task actions
- **Flask (In Progress)** – For future server-side features (e.g., document viewer)

---

## 🔗 Live App

Try it here:  
**[Kanba-DO on GitHub Pages](https://kwamesa.github.io/kanba-do/)**

---

## 📘 Learn More

Explore tips and answers in the in-app **FAQ section**, accessible from the sidebar.
