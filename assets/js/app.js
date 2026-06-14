/* Shared UI components and light interactions for the static UI scaffold */
(function () {
  const sidebarTemplate = `
    <aside class="sidebar glass" id="sidebar">
      <div class="logo">Student<span style="color:var(--accent)">Manager</span></div>
      <nav class="nav">
        <a href="dashboard.html" data-key="dashboard" class="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" stroke-width="1.2"/></svg><span>Dashboard</span></a>
        <a href="students.html" data-key="students" class="nav-item"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM3 21v-1a4 4 0 0 1 4-4h6" stroke="currentColor" stroke-width="1.2"/></svg><span>Students</span></a>
      </nav>
    </aside>
  `;

  const topbarTemplate = `
    <header class="topbar">
      <div style="display:flex;align-items:center;gap:8px">
        <button class="menu-toggle btn ghost" onclick="toggleSidebar()" style="display:none">☰</button>
        <div class="title">__PAGE_TITLE__</div>
      </div>
      <div class="top-actions">
        <div class="search">
          <input placeholder="Search students, classes..." style="width:100%;padding:8px;border-radius:8px;border:1px solid rgba(0,0,0,0.06);background:transparent;color:var(--text)" />
        </div>
        <div class="avatar"> <div class="badge">A</div> </div>
      </div>
    </header>
  `;



  /* ---------- Utilities ---------- */
  function q(sel, ctx = document) {
    return ctx.querySelector(sel);
  }
  function qAll(sel, ctx = document) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }
  function debounce(fn, wait = 200) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  function runIdle(fn) {
    if ("requestIdleCallback" in window)
      requestIdleCallback(fn, { timeout: 500 });
    else setTimeout(fn, 50);
  }



  window.toggleSidebar = function () {
    const sb = document.getElementById("sidebar");
    if (!sb) return;
    sb.classList.toggle("open");
  };

  function buildPage(page) {
    const root = document.getElementById("app-root");
    if (!root) return;
    // inject shell
    root.innerHTML = `
      <div class="app-shell">
        ${sidebarTemplate}
        <div class="main-area">
          ${topbarTemplate.replace("__PAGE_TITLE__", page.charAt(0).toUpperCase() + page.slice(1))}
          <main class="content">${renderContent(page)}</main>
        </div>
      </div>
    `;

    highlightNav(page);
    wireUpMobileToggle();
    if (page === "students") {
      // initialize student management interactions
      setTimeout(() => {
        try {
          initStudentsModule();
        } catch (e) {
          console.error(e);
        }
      }, 50);
    }
    if (page === "dashboard") {
      setTimeout(() => {
        try {
          initDashboardModule();
        } catch (e) {
          console.error(e);
        }
      }, 50);
    }
  }

  function wireUpMobileToggle() {
    const btn = document.querySelector(".menu-toggle");
    if (btn) btn.style.display = "none";
    if (window.matchMedia("(max-width:600px)").matches) {
      if (btn) btn.style.display = "inline-block";
      // Clicking outside sidebar closes it
      document.addEventListener("click", (e) => {
        const sb = document.getElementById("sidebar");
        if (!sb) return;
        if (
          sb.classList.contains("open") &&
          !sb.contains(e.target) &&
          !e.target.closest(".menu-toggle")
        )
          sb.classList.remove("open");
      });
    }
  }

  function highlightNav(page) {
    const links = document.querySelectorAll(".nav a");
    links.forEach((a) => {
      if (a.dataset.key === page) a.classList.add("active");
      else a.classList.remove("active");
    });
  }

  function renderContent(page) {
    // Dashboard with interactive filters, search and analytics
    if (page === "dashboard") {
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div>
            <h2>Overview</h2>
            <div class="muted">Live analytics from LocalStorage</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <input id="dash-search" placeholder="Search students by name or ID" style="padding:8px;border-radius:8px;border:1px solid rgba(0,0,0,0.06);background:transparent;color:var(--text)" />
          </div>
        </div>

        <div class="grid">
          <div class="card glass" id="card-total-students"><h3>Total Students</h3><p class="muted">0</p></div>
          <div class="card glass" id="card-total-departments"><h3>Total Departments</h3><p class="muted">0</p></div>
          <div class="card glass" id="card-male"><h3>Male Students</h3><p class="muted">0</p></div>
          <div class="card glass" id="card-female"><h3>Female Students</h3><p class="muted">0</p></div>
        </div>

        <div style="margin-top:18px" class="card">
          <h3>Recently Added Students</h3>
          <div id="recent-list" style="margin-top:12px">
            <!-- recent items -->
          </div>
        </div>

        <div style="margin-top:12px" class="card">
          <h3>Search Results</h3>
          <div id="search-results" style="margin-top:12px">
            <!-- results table -->
          </div>
        </div>
      `;
    }

    if (page === "students") {
      return `
        <div class="controls">
          <div>
            <h2>Students</h2>
            <div class="muted">Manage student records (local only)</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button id="add-student" class="btn primary">+ New Student</button>
          </div>
        </div>

        <div class="card">
          <div id="students-container">
            <table class="table" id="students-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Full name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="students-tbody">
                <!-- rows injected -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modal -->
        <div class="modal-overlay" id="student-modal">
          <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div class="modal-header">
              <strong id="modal-title">Add Student</strong>
              <button id="modal-close" class="btn ghost">✕</button>
            </div>
            <div class="modal-body">
              <form id="student-form">
                <div class="form-grid">
                  <label class="field"><span>Student ID</span><input name="studentID" required /></label>
                  <label class="field"><span>Full Name</span><input name="fullName" required /></label>
                  <label class="field"><span>Email</span><input name="email" type="email" required /></label>
                  <label class="field"><span>Phone Number</span><input name="phone" required /></label>
                  <label class="field"><span>Gender</span>
                    <select name="gender" required>
                      <option value="">Select...</option>
                      <option>Male</option>
                      <option>Female</option>
                    </select>
                  </label>
                  <label class="field"><span>Department</span><input name="department" required /></label>
                  <label class="field"><span>Year</span><input name="year" type="number" min="1" max="10" required /></label>
                  <label class="field"><span>Date of Birth</span><input name="dob" type="date" required /></label>
                  <label class="field" style="grid-column:1/-1"><span>Address</span><input name="address" /></label>
                </div>
                <div id="form-error" role="alert" aria-live="assertive" class="muted small" style="color:var(--danger);margin-top:8px;display:none"></div>
              </form>
            </div>
            <div class="modal-footer">
              <button id="modal-cancel" class="btn ghost">Cancel</button>
              <button id="modal-save" class="btn primary">Save</button>
            </div>
          </div>
        </div>
      `;
    }



    return `<div class="card">Unknown page</div>`;
  }

  /* ---------------- Student Module (LocalStorage CRUD) ---------------- */
  const STORAGE_KEY = "sm_students";

  function loadStudents() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveStudents(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
    try {
      document.dispatchEvent(
        new CustomEvent("students-updated", {
          detail: { count: (list || []).length },
        }),
      );
    } catch (e) {
      /* ignore */
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function formatDate(ts) {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString();
  }

  function escapeHtml(s) {
    if (!s) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function initStudentsModule() {
    const addBtn = document.getElementById("add-student");
    const modal = document.getElementById("student-modal");
    const modalTitle = document.getElementById("modal-title");
    const modalClose = document.getElementById("modal-close");
    const modalCancel = document.getElementById("modal-cancel");
    const modalSave = document.getElementById("modal-save");
    const form = document.getElementById("student-form");
    const tbody = document.getElementById("students-tbody");

    if (!tbody) return;

    // modal & accessibility state
    let editingUid = null;
    let lastActiveElement = null;
    let modalKeyHandler = null;
    const formError = q("#form-error");

    function renderList() {
      const students = loadStudents();
      if (students.length === 0) {
        tbody.innerHTML = `
          <tr><td colspan="7" class="muted">No students yet. Click “+ New Student” to add one.</td></tr>
        `;
        return;
      }

      runIdle(() => {
        tbody.innerHTML = students
          .map(
            (s) => `
          <tr>
            <td scope="row">${escapeHtml(s.studentID)}</td>
            <td>${escapeHtml(s.fullName)}</td>
            <td><a href="mailto:${escapeHtml(s.email)}">${escapeHtml(s.email)}</a></td>
            <td>${escapeHtml(s.phone)}</td>
            <td>${escapeHtml(s.department)}</td>
            <td>${escapeHtml(String(s.year))}</td>
            <td style="text-align:right">
              <div class="actions-row">
                <button aria-label="View ${escapeHtml(s.fullName)}" class="btn ghost btn-view" data-uid="${s._uid}">View</button>
                <button aria-label="Edit ${escapeHtml(s.fullName)}" class="btn ghost btn-edit" data-uid="${s._uid}">Edit</button>
                <button aria-label="Delete ${escapeHtml(s.fullName)}" class="btn" style="background:var(--danger);color:white" data-uid="${s._uid}" data-action="delete">Delete</button>
              </div>
            </td>
          </tr>`,
          )
          .join("\n");
      });
    }

    function openModal(mode, student) {
      editingUid = student && student._uid ? student._uid : null;
      lastActiveElement = document.activeElement;
      const dialog = modal.querySelector(".modal");
      modal.classList.add("open");
      document.body.style.overflow = "hidden";
      // attach key handler to trap focus and close on Escape
      modalKeyHandler = function (e) {
        const focusable =
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const nodes = Array.from(dialog.querySelectorAll(focusable)).filter(
          (n) => !n.hasAttribute("disabled"),
        );
        if (e.key === "Escape") {
          e.preventDefault();
          closeModal();
          return;
        }
        if (e.key === "Tab" && nodes.length) {
          const first = nodes[0];
          const last = nodes[nodes.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      document.addEventListener("keydown", modalKeyHandler);

      if (mode === "add") {
        modalTitle.textContent = "Add Student";
        form.reset();
        setFormDisabled(false);
        modalSave.style.display = "";
      } else if (mode === "edit") {
        modalTitle.textContent = "Edit Student";
        populateForm(student);
        setFormDisabled(false);
        modalSave.style.display = "";
      } else if (mode === "view") {
        modalTitle.textContent = "Student Details";
        populateForm(student);
        setFormDisabled(true);
        modalSave.style.display = "none";
      }

      // focus first focusable element
      setTimeout(() => {
        const focusable = dialog.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length) focusable[0].focus();
        dialog.focus();
      }, 40);
    }

    function closeModal() {
      modal.classList.remove("open");
      editingUid = null;
      if (modalKeyHandler)
        document.removeEventListener("keydown", modalKeyHandler);
      modalKeyHandler = null;
      document.body.style.overflow = "";
      if (lastActiveElement && typeof lastActiveElement.focus === "function")
        lastActiveElement.focus();
      if (formError) {
        formError.style.display = "none";
        formError.textContent = "";
      }
    }

    function setFormDisabled(dis) {
      const els = form.querySelectorAll("input,select,textarea");
      els.forEach((i) => (i.disabled = !!dis));
    }

    function populateForm(s) {
      if (!s) return;
      form.studentID.value = s.studentID || "";
      form.fullName.value = s.fullName || "";
      form.email.value = s.email || "";
      form.phone.value = s.phone || "";
      form.gender.value = s.gender || "";
      form.department.value = s.department || "";
      form.year.value = s.year || "";
      form.dob.value = s.dob || "";
      form.address.value = s.address || "";
    }

    function getFormData() {
      return {
        studentID: form.studentID.value.trim(),
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        gender: form.gender.value,
        department: form.department.value.trim(),
        year: form.year.value.trim(),
        dob: form.dob.value,
        address: form.address.value.trim(),
      };
    }

    function validate(data) {
      const required = [
        "studentID",
        "fullName",
        "email",
        "phone",
        "gender",
        "department",
        "year",
        "dob",
      ];
      for (const k of required) {
        if (!data[k]) return `${k} is required`;
      }
      // email simple regex
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(data.email)) return "Invalid email";
      // phone simple validation (digits and allowed chars)
      const phoneRe = /^[0-9+()\-\s]{6,20}$/;
      if (!phoneRe.test(data.phone)) return "Invalid phone number";
      // prevent duplicate studentID
      const students = loadStudents();
      const exists = students.find(
        (s) => s.studentID === data.studentID && s._uid !== editingUid,
      );
      if (exists) return "Student ID already exists";
      return null;
    }

    function saveFromForm() {
      const data = getFormData();
      const err = validate(data);
      if (err) {
        if (formError) {
          formError.textContent = err;
          formError.style.display = "block";
        }
        try {
          showToast(err, "error");
        } catch (e) {}
        return;
      }

      const students = loadStudents();
      if (editingUid) {
        // update
        const idx = students.findIndex((s) => s._uid === editingUid);
        if (idx !== -1) {
          students[idx] = Object.assign({}, students[idx], data, {
            updatedAt: Date.now(),
          });
        }
      } else {
        // create
        const item = Object.assign({}, data, {
          _uid: uid(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        students.unshift(item);
      }
      saveStudents(students);
      renderList();
      try {
        showToast(editingUid ? "Student updated" : "Student added", "success");
      } catch (e) {}
      closeModal();
    }

    // Click handlers for table actions
    tbody.addEventListener("click", (e) => {
      const view = e.target.closest(".btn-view");
      const edit = e.target.closest(".btn-edit");
      const del = e.target.closest('[data-action="delete"]');
      if (view) {
        const uid = view.dataset.uid;
        const s = loadStudents().find((x) => x._uid === uid);
        if (s) openModal("view", s);
      }
      if (edit) {
        const uid = edit.dataset.uid;
        const s = loadStudents().find((x) => x._uid === uid);
        if (s) openModal("edit", s);
      }
      if (del) {
        const uid = del.dataset.uid;
        confirmDialog("Delete this student?").then((ok) => {
          if (!ok) return;
          const list = loadStudents().filter((x) => x._uid !== uid);
          saveStudents(list);
          renderList();
          try {
            showToast("Student deleted", "info");
          } catch (e) {}
        });
      }
    });

    // Buttons
    addBtn && addBtn.addEventListener("click", () => openModal("add"));

    modalClose && modalClose.addEventListener("click", closeModal);
    modalCancel && modalCancel.addEventListener("click", closeModal);
    modalSave &&
      modalSave.addEventListener("click", (e) => {
        e.preventDefault();
        saveFromForm();
      });

    // prevent form submit default
    form &&
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        saveFromForm();
      });

    // Utilities (uses global escapeHtml)

    // initial render
    renderList();
  }

  /* ---------------- UI helpers: Toasts & Confirm ---------------- */
  function ensureUiHelpers() {
    if (
      document.querySelector(".toast-container") &&
      document.getElementById("confirm-overlay")
    )
      return;
    const tc = document.createElement("div");
    tc.className = "toast-container";
    tc.setAttribute("aria-live", "polite");
    tc.setAttribute("role", "status");
    document.body.appendChild(tc);
    if (!document.getElementById("confirm-overlay")) {
      const conf = document.createElement("div");
      conf.className = "confirm-overlay";
      conf.id = "confirm-overlay";
      conf.innerHTML = `<div class="confirm-box"><div id="confirm-message"></div><div class="row"><div></div><div style="display:flex;gap:8px"><button id="confirm-cancel" class="btn ghost">Cancel</button><button id="confirm-ok" class="btn primary">OK</button></div></div></div>`;
      document.body.appendChild(conf);
    }
  }

  function showToast(msg, type = "info", timeout = 3200) {
    try {
      ensureUiHelpers();
      const container = document.querySelector(".toast-container");
      const t = document.createElement("div");
      t.className = `toast ${type}`;
      t.textContent = msg;
      container.appendChild(t);
      requestAnimationFrame(() => t.classList.add("show"));
      setTimeout(() => {
        t.classList.remove("show");
        setTimeout(() => t.remove(), 220);
      }, timeout);
    } catch (e) {
      console.error("toast error", e);
    }
  }

  function confirmDialog(message) {
    return new Promise((resolve) => {
      ensureUiHelpers();
      const overlay = document.getElementById("confirm-overlay");
      const msg = overlay.querySelector("#confirm-message");
      const ok = overlay.querySelector("#confirm-ok");
      const cancel = overlay.querySelector("#confirm-cancel");
      msg.textContent = message;
      overlay.classList.add("open");
      function done(val) {
        overlay.classList.remove("open");
        ok.removeEventListener("click", onOk);
        cancel.removeEventListener("click", onCancel);
        resolve(val);
      }
      function onOk() {
        done(true);
      }
      function onCancel() {
        done(false);
      }
      ok.addEventListener("click", onOk);
      cancel.addEventListener("click", onCancel);
    });
  }

  /* ---------------- Dashboard Module ---------------- */
  function initDashboardModule() {
    const totalCard = document.getElementById("card-total-students");
    const deptCard = document.getElementById("card-total-departments");
    const maleCard = document.getElementById("card-male");
    const femaleCard = document.getElementById("card-female");
    const recentList = document.getElementById("recent-list");
    const searchInput = document.getElementById("dash-search");
    const resultsContainer = document.getElementById("search-results");

    if (!totalCard) return;

    function computeStats(list) {
      const total = list.length;
      const depts = new Set(list.map((s) => s.department).filter(Boolean));
      const male = list.filter(
        (s) => String(s.gender).toLowerCase() === "male",
      ).length;
      const female = list.filter(
        (s) => String(s.gender).toLowerCase() === "female",
      ).length;
      return { total, departments: depts.size, male, female };
    }

    function renderCards(list) {
      const st = computeStats(list);
      totalCard.querySelector("p").textContent = st.total;
      deptCard.querySelector("p").textContent = st.departments;
      maleCard.querySelector("p").textContent = st.male;
      femaleCard.querySelector("p").textContent = st.female;
    }

    function renderRecent(list, limit = 6) {
      const items = list
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
      if (items.length === 0) {
        recentList.innerHTML = '<div class="muted">No recent students</div>';
        return;
      }
      recentList.innerHTML = items
        .map(
          (s) =>
            `<div style="padding:8px 0;border-bottom:1px solid var(--glass-border)"><strong>${escapeHtml(s.fullName)}</strong> <span class="muted">(${escapeHtml(s.studentID)})</span><div class="muted small">${escapeHtml(s.department)} • Year ${escapeHtml(String(s.year))} • ${formatDate(s.createdAt)}</div></div>`,
        )
        .join("");
    }

    function buildResults(list) {
      if (list.length === 0) {
        resultsContainer.innerHTML = '<div class="muted">No results</div>';
        return;
      }
      resultsContainer.innerHTML = `
        <table class="table"><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Department</th><th>Year</th></tr></thead>
        <tbody>${list.map((s) => `<tr><td>${escapeHtml(s.studentID)}</td><td>${escapeHtml(s.fullName)}</td><td>${escapeHtml(s.email)}</td><td>${escapeHtml(s.department)}</td><td>${escapeHtml(String(s.year))}</td></tr>`).join("")}</tbody></table>
      `;
    }

    function applyFiltersAndSearch() {
      let list = loadStudents();
      const q = searchInput && searchInput.value.trim().toLowerCase();
      if (q) {
        list = list.filter(
          (s) =>
            (s.fullName || "").toLowerCase().includes(q) ||
            (s.studentID || "").toLowerCase().includes(q) ||
            (s.email || "").toLowerCase().includes(q),
        );
      }

      list.sort((a, b) => b.createdAt - a.createdAt);
      buildResults(list);
    }

    // initial render
    const all = loadStudents();
    renderCards(all);
    renderRecent(all);
    buildResults(all.slice().sort((a, b) => b.createdAt - a.createdAt));

    // wire events
    if (searchInput) {
      searchInput.addEventListener("input", () => applyFiltersAndSearch());
    }

    // refresh when students update
    document.addEventListener("students-updated", () => {
      const cur = loadStudents();
      renderCards(cur);
      renderRecent(cur);
      applyFiltersAndSearch();
    });
  }

  // Initialize
  document.addEventListener("DOMContentLoaded", () => {
    // Check credentials on login page
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const user = document.getElementById("login-username").value.trim();
        const pass = document.getElementById("login-password").value;
        const errorDiv = document.getElementById("login-error");

        if (user === "admin" && pass === "admin123") {
          location.href = "dashboard.html";
        } else {
          errorDiv.textContent = "Invalid username or password";
          errorDiv.style.display = "block";
        }
      });
    }

    const root = document.getElementById("app-root");
    if (root) {
      const page = root.dataset.page || "dashboard";
      buildPage(page);
    }
  });


})();
