(() => {
  const STORAGE_KEY = "scholarflow_data_v1";
  const THEME_KEY = "scholarflow_theme";

  const todayISO = () => new Date().toISOString().split("T")[0];
  const offsetDateISO = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  const defaultData = () => ({
    subjects: [
      { id: "sub-1", name: "Calculus & Analysis", color: "#4f46e5" },
      { id: "sub-2", name: "Computer Science", color: "#0ea5e9" },
      { id: "sub-3", name: "Organic Chemistry", color: "#10b981" },
      { id: "sub-4", name: "World History", color: "#f59e0b" }
    ],
    tasks: [
      {
        id: "t-1",
        title: "Integration by Parts Practice Set",
        subjectId: "sub-1",
        date: todayISO(),
        estMinutes: 60,
        loggedMinutes: 25,
        priority: "high",
        status: "in-progress",
        notes: "Complete odd-numbered problems 1-25."
      },
      {
        id: "t-2",
        title: "Binary Search Trees Implementation",
        subjectId: "sub-2",
        date: offsetDateISO(1),
        estMinutes: 90,
        loggedMinutes: 0,
        priority: "high",
        status: "todo",
        notes: "Write insertion, traversal, and deletion unit tests."
      },
      {
        id: "t-3",
        title: "Reaction Mechanisms Flashcards",
        subjectId: "sub-3",
        date: offsetDateISO(-1),
        estMinutes: 45,
        loggedMinutes: 45,
        priority: "medium",
        status: "done",
        notes: "SN1 vs SN2 stereochemistry review."
      },
      {
        id: "t-4",
        title: "Read Chapter 9: Industrial Revolution",
        subjectId: "sub-4",
        date: offsetDateISO(3),
        estMinutes: 50,
        loggedMinutes: 0,
        priority: "low",
        status: "todo",
        notes: "Summarize primary causes and timeline."
      }
    ]
  });

  let state = loadState();
  let weekOffset = 0;

  // Timer State
  let timerDuration = 25 * 60;
  let timerRemaining = timerDuration;
  let timerInterval = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse saved state", e);
    }
    const initial = defaultData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderAll();
  }

  function getSubject(id) {
    return state.subjects.find((s) => s.id === id) || { name: "General", color: "#64748b" };
  }

  // Navigation
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.view;
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
      document.getElementById(`view-${target}`).classList.add("active");

      const titles = {
        dashboard: "Dashboard Overview",
        tasks: "Study Plan & Tasks",
        weekly: "Weekly Study Schedule",
        timer: "Pomodoro Focus Timer"
      };
      document.getElementById("viewTitle").textContent = titles[target];
    });
  });

  // Theme
  if (localStorage.getItem(THEME_KEY) === "dark") {
    document.body.classList.add("dark");
  }
  document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(THEME_KEY, document.body.classList.contains("dark") ? "dark" : "light");
  });

  // Modals
  function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
  }
  function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
  }
  document.querySelectorAll("[data-close]").forEach((el) => {
    el.addEventListener("click", () => closeModal(el.dataset.close));
  });

  document.getElementById("openTaskModalBtn").addEventListener("click", () => {
    document.getElementById("taskForm").reset();
    document.getElementById("taskId").value = "";
    document.getElementById("taskDate").value = todayISO();
    document.getElementById("taskModalTitle").textContent = "New Study Task";
    openModal("taskModal");
  });

  document.getElementById("openSubjectModalBtn").addEventListener("click", () => {
    openModal("subjectModal");
  });

  // Subject CRUD
  document.getElementById("subjectForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("subjectName").value.trim();
    const color = document.getElementById("subjectColor").value;
    if (!name) return;
    state.subjects.push({ id: "sub-" + Date.now(), name, color });
    document.getElementById("subjectName").value = "";
    saveState();
  });

  window.deleteSubject = (id) => {
    if (state.subjects.length <= 1) {
      alert("At least one subject is required.");
      return;
    }
    state.subjects = state.subjects.filter((s) => s.id !== id);
    const fallback = state.subjects[0].id;
    state.tasks.forEach((t) => {
      if (t.subjectId === id) t.subjectId = fallback;
    });
    saveState();
  };

  // Task CRUD
  document.getElementById("taskForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const id = document.getElementById("taskId").value;
    const payload = {
      title: document.getElementById("taskTitle").value.trim(),
      subjectId: document.getElementById("taskSubject").value,
      date: document.getElementById("taskDate").value,
      estMinutes: parseInt(document.getElementById("taskEstMinutes").value, 10) || 30,
      priority: document.getElementById("taskPriority").value,
      status: document.getElementById("taskStatus").value,
      notes: document.getElementById("taskNotes").value.trim()
    };

    if (id) {
      const idx = state.tasks.findIndex((t) => t.id === id);
      if (idx !== -1) state.tasks[idx] = { ...state.tasks[idx], ...payload };
    } else {
      state.tasks.push({ id: "t-" + Date.now(), loggedMinutes: 0, ...payload });
    }
    closeModal("taskModal");
    saveState();
  });

  window.toggleTaskDone = (id) => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    task.status = task.status === "done" ? "todo" : "done";
    saveState();
  };

  window.editTask = (id) => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    document.getElementById("taskId").value = task.id;
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskSubject").value = task.subjectId;
    document.getElementById("taskDate").value = task.date;
    document.getElementById("taskEstMinutes").value = task.estMinutes;
    document.getElementById("taskPriority").value = task.priority;
    document.getElementById("taskStatus").value = task.status;
    document.getElementById("taskNotes").value = task.notes || "";
    document.getElementById("taskModalTitle").textContent = "Edit Study Task";
    openModal("taskModal");
  };

  window.deleteTask = (id) => {
    state.tasks = state.tasks.filter((t) => t.id !== id);
    saveState();
  };

  // Filters
  ["searchInput", "filterSubject", "filterStatus", "filterPriority"].forEach((id) => {
    document.getElementById(id).addEventListener("input", renderTasks);
  });

  // Weekly Navigation
  document.getElementById("prevWeekBtn").addEventListener("click", () => {
    weekOffset--;
    renderWeekly();
  });
  document.getElementById("nextWeekBtn").addEventListener("click", () => {
    weekOffset++;
    renderWeekly();
  });

  // Focus Timer Logic
  const CIRCUMFERENCE = 2 * Math.PI * 96;
  const circleEl = document.getElementById("timerProgressCircle");
  circleEl.style.strokeDasharray = CIRCUMFERENCE;

  function updateTimerDisplay() {
    const mins = Math.floor(timerRemaining / 60).toString().padStart(2, "0");
    const secs = (timerRemaining % 60).toString().padStart(2, "0");
    document.getElementById("timerTime").textContent = `${mins}:${secs}`;
    const fraction = timerRemaining / timerDuration;
    circleEl.style.strokeDashoffset = CIRCUMFERENCE * (1 - fraction);
  }

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      clearInterval(timerInterval);
      timerInterval = null;
      document.querySelectorAll(".mode-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      timerDuration = parseInt(btn.dataset.minutes, 10) * 60;
      timerRemaining = timerDuration;
      document.getElementById("timerStartBtn").disabled = false;
      document.getElementById("timerPauseBtn").disabled = true;
      document.getElementById("timerStatusText").textContent = "Ready to focus";
      updateTimerDisplay();
    });
  });

  document.getElementById("timerStartBtn").addEventListener("click", () => {
    if (timerInterval) return;
    document.getElementById("timerStartBtn").disabled = true;
    document.getElementById("timerPauseBtn").disabled = false;
    document.getElementById("timerStatusText").textContent = "Session in progress...";

    timerInterval = setInterval(() => {
      timerRemaining--;
      updateTimerDisplay();
      if (timerRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        document.getElementById("timerStartBtn").disabled = false;
        document.getElementById("timerPauseBtn").disabled = true;
        document.getElementById("timerStatusText").textContent = "Session completed!";

        const completedMins = Math.round(timerDuration / 60);
        const linkedTaskId = document.getElementById("timerTaskSelect").value;
        if (linkedTaskId) {
          const task = state.tasks.find((t) => t.id === linkedTaskId);
          if (task) {
            task.loggedMinutes = (task.loggedMinutes || 0) + completedMins;
            saveState();
          }
        }
        alert(`Focus session complete! (+${completedMins} mins logged)`);
        timerRemaining = timerDuration;
        updateTimerDisplay();
      }
    }, 1000);
  });

  document.getElementById("timerPauseBtn").addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById("timerStartBtn").disabled = false;
    document.getElementById("timerPauseBtn").disabled = true;
    document.getElementById("timerStatusText").textContent = "Paused";
  });

  document.getElementById("timerResetBtn").addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timerRemaining = timerDuration;
    document.getElementById("timerStartBtn").disabled = false;
    document.getElementById("timerPauseBtn").disabled = true;
    document.getElementById("timerStatusText").textContent = "Ready to focus";
    updateTimerDisplay();
  });

  // Export / Import / Reset
  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `scholarflow-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("importInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.subjects && parsed.tasks) {
          state = parsed;
          saveState();
          alert("Study plan imported successfully!");
        }
      } catch {
        alert("Invalid JSON backup file.");
      }
    };
    reader.readAsText(file);
  });

  document.getElementById("resetDemoBtn").addEventListener("click", () => {
    if (confirm("Reset all tasks and subjects back to sample data?")) {
      state = defaultData();
      saveState();
    }
  });

  // Rendering Functions
  function renderSelectOptions() {
    const taskSubject = document.getElementById("taskSubject");
    const filterSubject = document.getElementById("filterSubject");
    const timerTaskSelect = document.getElementById("timerTaskSelect");
    const subjectManagerList = document.getElementById("subjectManagerList");

    const prevFilter = filterSubject.value;
    const prevTimerTask = timerTaskSelect.value;

    taskSubject.innerHTML = state.subjects
      .map((s) => `<option value="${s.id}">${s.name}</option>`)
      .join("");

    filterSubject.innerHTML =
      `<option value="all">All Subjects</option>` +
      state.subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
    filterSubject.value = prevFilter || "all";

    timerTaskSelect.innerHTML =
      `<option value="">-- General Study Session --</option>` +
      state.tasks
        .filter((t) => t.status !== "done")
        .map((t) => `<option value="${t.id}">${t.title}</option>`)
        .join("");
    timerTaskSelect.value = prevTimerTask || "";

    subjectManagerList.innerHTML = state.subjects
      .map(
        (s) => `
        <div class="subject-manager-item">
          <span><strong style="color:${s.color}">●</strong> ${s.name}</span>
          <button class="btn btn-ghost btn-sm" onclick="deleteSubject('${s.id}')">Remove</button>
        </div>`
      )
      .join("");
  }

  function renderDashboard() {
    const total = state.tasks.length;
    const done = state.tasks.filter((t) => t.status === "done").length;
    const pct = total ? Math.round((done / total) * 100) : 0;

    const estMins = state.tasks.reduce((sum, t) => sum + (t.estMinutes || 0), 0);
    const loggedMins = state.tasks.reduce((sum, t) => sum + (t.loggedMinutes || 0), 0);

    const today = todayISO();
    const dueToday = state.tasks.filter((t) => t.date === today && t.status !== "done").length;
    const overdue = state.tasks.filter((t) => t.date < today && t.status !== "done").length;

    document.getElementById("kpiCompletion").textContent = `${pct}%`;
    document.getElementById("kpiTaskCount").textContent = `${done} of ${total} tasks completed`;
    document.getElementById("kpiHours").textContent = `${(loggedMins / 60).toFixed(1)}h / ${(estMins / 60).toFixed(1)}h`;
    document.getElementById("kpiDueToday").textContent = dueToday;
    document.getElementById("kpiOverdue").textContent = `${overdue} overdue`;
    document.getElementById("kpiSubjects").textContent = state.subjects.length;

    // Subject Progress
    const subContainer = document.getElementById("subjectProgressList");
    subContainer.innerHTML = state.subjects
      .map((s) => {
        const subTasks = state.tasks.filter((t) => t.subjectId === s.id);
        const subDone = subTasks.filter((t) => t.status === "done").length;
        const subPct = subTasks.length ? Math.round((subDone / subTasks.length) * 100) : 0;
        return `
          <div class="progress-item">
            <div class="progress-meta">
              <span><strong>${s.name}</strong></span>
              <span class="muted">${subDone}/${subTasks.length} (${subPct}%)</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${subPct}%; background:${s.color}"></div>
            </div>
          </div>`;
      })
      .join("");

    // Upcoming Deadlines
    const upcoming = state.tasks
      .filter((t) => t.status !== "done")
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6);

    const deadContainer = document.getElementById("upcomingDeadlinesList");
    if (!upcoming.length) {
      deadContainer.innerHTML = `<p class="muted">All caught up! No pending deadlines.</p>`;
    } else {
      deadContainer.innerHTML = upcoming
        .map((t) => {
          const sub = getSubject(t.subjectId);
          const isOverdue = t.date < today;
          return `
            <div class="deadline-item">
              <div>
                <strong>${t.title}</strong>
                <div class="muted" style="font-size:0.8rem;">
                  <span style="color:${sub.color}">● ${sub.name}</span> · ${t.estMinutes}m
                </div>
              </div>
              <span class="badge ${isOverdue ? "badge-high" : "badge-low"}">
                ${isOverdue ? "Overdue: " : ""}${t.date}
              </span>
            </div>`;
        })
        .join("");
    }
  }

  function renderTasks() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const subFilter = document.getElementById("filterSubject").value;
    const statusFilter = document.getElementById("filterStatus").value;
    const prioFilter = document.getElementById("filterPriority").value;

    const filtered = state.tasks
      .filter((t) => {
        const matchesSearch =
          t.title.toLowerCase().includes(query) ||
          (t.notes && t.notes.toLowerCase().includes(query));
        const matchesSub = subFilter === "all" || t.subjectId === subFilter;
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        const matchesPrio = prioFilter === "all" || t.priority === prioFilter;
        return matchesSearch && matchesSub && matchesStatus && matchesPrio;
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    const container = document.getElementById("tasksContainer");
    if (!filtered.length) {
      container.innerHTML = `<div class="card"><p class="muted">No matching study tasks found.</p></div>`;
      return;
    }

    container.innerHTML = filtered
      .map((t) => {
        const sub = getSubject(t.subjectId);
        return `
          <div class="task-card ${t.status === "done" ? "done" : ""}" style="border-left-color:${sub.color}">
            <div class="task-left">
              <input type="checkbox" class="task-checkbox" ${t.status === "done" ? "checked" : ""} onchange="toggleTaskDone('${t.id}')" />
              <div>
                <div class="task-title"><strong>${t.title}</strong></div>
                <div class="muted" style="font-size:0.85rem; margin: 0.25rem 0;">
                  <span class="badge badge-${t.priority}">${t.priority.toUpperCase()}</span>
                  <span style="color:${sub.color}; font-weight:600;">${sub.name}</span> · Due ${t.date} · ${t.loggedMinutes || 0}/${t.estMinutes} mins
                </div>
                ${t.notes ? `<p class="muted" style="font-size:0.85rem;">${t.notes}</p>` : ""}
              </div>
            </div>
            <div class="task-actions">
              <button class="btn btn-secondary btn-sm" onclick="editTask('${t.id}')">Edit</button>
              <button class="btn btn-ghost btn-sm" onclick="deleteTask('${t.id}')">Delete</button>
            </div>
          </div>`;
      })
      .join("");
  }

  function renderWeekly() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sun
    const mondayDiff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + weekOffset * 7;
    const monday = new Date(now.setDate(mondayDiff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }

    const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    document.getElementById("weekRangeLabel").textContent = `${fmt(days[0])} – ${fmt(days[6])}`;

    const today = todayISO();
    const grid = document.getElementById("weeklyGrid");

    grid.innerHTML = days
      .map((d) => {
        const iso = d.toISOString().split("T")[0];
        const dayTasks = state.tasks.filter((t) => t.date === iso);
        const totalMins = dayTasks.reduce((sum, t) => sum + (t.estMinutes || 0), 0);
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

        return `
          <div class="day-col ${iso === today ? "today" : ""}">
            <div class="day-header">
              <strong>${dayName} ${d.getDate()}</strong>
              <span class="muted" style="font-size:0.75rem;">${totalMins}m</span>
            </div>
            ${dayTasks
              .map((t) => {
                const sub = getSubject(t.subjectId);
                return `
                  <div class="mini-task ${t.status === "done" ? "done" : ""}" style="border-left-color:${sub.color}" onclick="toggleTaskDone('${t.id}')" title="Click to toggle complete">
                    <div><strong>${t.title}</strong></div>
                    <div class="muted" style="font-size:0.75rem;">${sub.name} · ${t.estMinutes}m</div>
                  </div>`;
              })
              .join("")}
          </div>`;
      })
      .join("");
  }

  function renderAll() {
    document.getElementById("currentDateDisplay").textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    renderSelectOptions();
    renderDashboard();
    renderTasks();
    renderWeekly();
  }

  updateTimerDisplay();
  renderAll();
})();
