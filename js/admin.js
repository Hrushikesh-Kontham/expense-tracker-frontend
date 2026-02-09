let allUsers = [];
let selectedUserId = null;
let selectedAction = null; // "enable" or "disable"
let isProcessing = false;

/* ================= ADMIN PROTECTION ================= */

function requireAdmin() {
  const role = localStorage.getItem("role");

  if (role !== "ADMIN") {
    location.href = "/dashboard";
  }
}

/* ================= UI HELPERS ================= */

function setAdminMessage(text, isError = true) {
  const empty = document.getElementById("adminEmptyState");
  if (!empty) return;

  empty.style.display = "block";
  empty.innerText = text;
  empty.style.color = isError ? "var(--danger)" : "var(--success)";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ================= LOAD USERS ================= */

async function loadUsers() {
  const empty = document.getElementById("adminEmptyState");

  try {
    const res = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: authHeaders()
    });

    if (!res.ok) {
      setAdminMessage("Failed to load users.");
      return;
    }

    const data = await res.json();

    // ✅ Sort users: active first, then email
    data.sort((a, b) => {
      if (a.enabled !== b.enabled) return b.enabled - a.enabled;
      return a.email.localeCompare(b.email);
    });

    allUsers = data;

    if (empty) empty.style.display = "none";

    renderUsers(data);

  } catch (err) {
    console.error("Load users error:", err);
    setAdminMessage("Something went wrong while loading users.");
  }
}

/* ================= RENDER USERS ================= */

function renderUsers(users) {
  const list = document.getElementById("usersList");
  const empty = document.getElementById("adminEmptyState");

  if (!list || !empty) return;

  list.innerHTML = "";

  if (!users.length) {
    empty.style.display = "block";
    empty.innerText = "No users found.";
    empty.style.color = "var(--muted)";
    return;
  }

  empty.style.display = "none";

  users.forEach(u => {
    const li = document.createElement("li");

    const statusText = u.enabled ? "Active" : "Disabled";
    const statusColor = u.enabled ? "var(--success)" : "var(--danger)";
    const actionText = u.enabled ? "Disable" : "Enable";

    li.innerHTML = `
      <div class="expense-left">
        <strong>${escapeHtml(u.email)}</strong>
        <small>
          Role: ${escapeHtml(u.role)} • 
          <span style="color:${statusColor}; font-weight:700;">${statusText}</span>
        </small>
      </div>

      <div class="expense-right">
        <button class="edit-btn" onclick="openAdminModal('${u.id}', '${u.enabled ? "disable" : "enable"}', '${escapeHtml(u.email)}')">
          ${actionText}
        </button>
      </div>
    `;

    list.appendChild(li);
  });
}

/* ================= MODAL ================= */

function openAdminModal(userId, action, email) {
  selectedUserId = userId;
  selectedAction = action;

  const modal = document.getElementById("adminActionModal");
  const title = document.getElementById("adminModalTitle");
  const text = document.getElementById("adminModalText");
  const btn = document.getElementById("adminConfirmBtn");

  if (!modal || !title || !text || !btn) return;

  btn.disabled = false;
  btn.innerText = action === "disable" ? "Disable" : "Enable";

  if (action === "disable") {
    title.innerText = "Disable User";
    text.innerText = `Are you sure you want to disable "${email}"?`;
    btn.style.background = "var(--danger)";
    btn.style.color = "white";
  } else {
    title.innerText = "Enable User";
    text.innerText = `Are you sure you want to enable "${email}"?`;
    btn.style.background = "var(--accent)";
    btn.style.color = "#022c22";
  }

  modal.classList.remove("hidden");
}

function closeAdminModal() {
  selectedUserId = null;
  selectedAction = null;
  isProcessing = false;

  const modal = document.getElementById("adminActionModal");
  if (modal) modal.classList.add("hidden");
}

/* ================= CONFIRM ACTION ================= */

async function confirmAdminAction() {
  if (!selectedUserId || !selectedAction) return;
  if (isProcessing) return;

  isProcessing = true;

  const btn = document.getElementById("adminConfirmBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "Processing...";
  }

  const url =
    selectedAction === "disable"
      ? `${BASE_URL}/api/admin/users/${selectedUserId}/disable`
      : `${BASE_URL}/api/admin/users/${selectedUserId}/enable`;

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: authHeaders()
    });

    if (!res.ok) {
      setAdminMessage("Action failed.");
      isProcessing = false;
      if (btn) {
        btn.disabled = false;
        btn.innerText = selectedAction === "disable" ? "Disable" : "Enable";
      }
      return;
    }

    closeAdminModal();
    await loadUsers();

  } catch (err) {
    console.error("Admin action error:", err);
    setAdminMessage("Something went wrong while updating user.");
    isProcessing = false;

    if (btn) {
      btn.disabled = false;
      btn.innerText = selectedAction === "disable" ? "Disable" : "Enable";
    }
  }
}

/* ================= SEARCH ================= */

function setupSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    const value = input.value.trim().toLowerCase();

    const filtered = allUsers.filter(u =>
      u.email.toLowerCase().includes(value)
    );

    renderUsers(filtered);
  });
}

/* ================= UX (ESC + OUTSIDE CLICK) ================= */

function setupModalUX() {
  const modal = document.getElementById("adminActionModal");
  if (!modal) return;

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAdminModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAdminModal();
  });
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  requireAdmin();
  applyRoleVisibility();
  setProfileEmail();

  setupSearch();
  setupModalUX();
  loadUsers();
});