/* ================= AUTH HELPERS ================= */

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("email");
  localStorage.removeItem("role");

  window.location.href = "login.html";
}

function requireAuth() {
  const token = localStorage.getItem("token");

  if (!token) {
    logout();
  }
}

function applyRoleVisibility() {
  const role = localStorage.getItem("role");

  document.querySelectorAll(".admin-only").forEach(el => {
    el.style.display = role === "ADMIN" ? "block" : "none";
  });
}

function setProfileEmail() {
  const el = document.getElementById("profileEmail");
  if (el) {
    el.innerText = localStorage.getItem("email") || "";
  }
}

/* ================= API HELPERS ================= */

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders(json = false) {
  const token = getToken();

  const headers = {
    Authorization: `Bearer ${token}`
  };

  if (json) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

/* ================= MODAL UX HELPERS ================= */

function setupModalCloseOnOutsideClick() {
  const editModal = document.getElementById("editModal");
  const deleteModal = document.getElementById("deleteModal");
  const adminModal = document.getElementById("adminActionModal");

  if (editModal) {
    editModal.addEventListener("click", (e) => {
      if (e.target === editModal && typeof closeEditModal === "function") {
        closeEditModal();
      }
    });
  }

  if (deleteModal) {
    deleteModal.addEventListener("click", (e) => {
      if (e.target === deleteModal && typeof closeDeleteModal === "function") {
        closeDeleteModal();
      }
    });
  }

  if (adminModal) {
    adminModal.addEventListener("click", (e) => {
      if (e.target === adminModal && typeof closeAdminModal === "function") {
        closeAdminModal();
      }
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (typeof closeEditModal === "function") closeEditModal();
      if (typeof closeDeleteModal === "function") closeDeleteModal();
      if (typeof closeAdminModal === "function") closeAdminModal();
    }
  });
}