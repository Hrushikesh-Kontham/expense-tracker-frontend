let currentExpenses = [];
let editingExpenseId = null;
let deletingExpenseId = null;

/* ================= HELPERS ================= */

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders(json = false) {
  const headers = {
    Authorization: `Bearer ${getToken()}`
  };

  if (json) headers["Content-Type"] = "application/json";

  return headers;
}

/* ================= LOAD EXPENSES ================= */

async function loadExpenses() {
  const list = document.getElementById("expenseList");
  const empty = document.getElementById("emptyState");

  try {
    const res = await fetch(`${BASE_URL}/api/expenses`, {
      method: "GET",
      headers: authHeaders()
    });

    if (!res.ok) {
      console.error("Failed to load expenses:", res.status);
      empty.style.display = "block";
      list.innerHTML = "";
      return;
    }

    const data = await res.json();

    // Latest first
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    currentExpenses = data;
    list.innerHTML = "";

    if (!data.length) {
      empty.style.display = "block";
      return;
    }

    empty.style.display = "none";

    data.forEach(e => {
      const li = document.createElement("li");

      li.innerHTML = `
        <div class="expense-left">
          <strong>${e.title || "Untitled"}</strong>
          <small>${e.category} • ${e.paymentMode} • ${e.expenseDate}</small>
        </div>

        <div class="expense-right">
          <span class="expense-amount">₹${e.amount}</span>

          <button class="edit-btn" onclick="openEditModal('${e.id}')">Edit</button>
          <button class="delete-btn" onclick="openDeleteModal('${e.id}')">Delete</button>
        </div>
      `;

      list.appendChild(li);
    });

  } catch (err) {
    console.error("Load expenses error:", err);
    empty.style.display = "block";
    list.innerHTML = "";
  }
}

/* ================= EDIT MODAL ================= */

function openEditModal(id) {
  const expense = currentExpenses.find(e => e.id === id);
  if (!expense) return;

  editingExpenseId = id;

  document.getElementById("editTitle").value = expense.title || "";
  document.getElementById("editAmount").value = expense.amount || "";
  document.getElementById("editExpenseDate").value = expense.expenseDate || "";
  document.getElementById("editCategory").value = expense.category || "FOOD";
  document.getElementById("editPaymentMode").value = expense.paymentMode || "CASH";

  document.getElementById("editError").innerText = "";
  document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
  editingExpenseId = null;
  document.getElementById("editModal").classList.add("hidden");
}

/* ================= UPDATE EXPENSE ================= */

async function updateExpense() {
  const editError = document.getElementById("editError");

  if (!editingExpenseId) {
    editError.innerText = "Invalid expense";
    return;
  }

  const title = document.getElementById("editTitle").value.trim();
  const amount = document.getElementById("editAmount").value;
  const expenseDate = document.getElementById("editExpenseDate").value;
  const category = document.getElementById("editCategory").value;
  const paymentMode = document.getElementById("editPaymentMode").value;

  if (!title || !amount || !expenseDate) {
    editError.innerText = "All fields required";
    return;
  }

  if (Number(amount) <= 0) {
    editError.innerText = "Amount must be greater than 0";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/expenses/${editingExpenseId}`, {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({
        title,
        amount: Number(amount),
        expenseDate,
        category,
        paymentMode
      })
    });

    if (!res.ok) {
      const msg = await res.text();
      console.error("Update failed:", msg);
      editError.innerText = "Failed to update expense";
      return;
    }

    closeEditModal();
    await loadExpenses();

  } catch (err) {
    console.error("Update expense error:", err);
    editError.innerText = "Something went wrong";
  }
}

/* ================= DELETE MODAL ================= */

function openDeleteModal(id) {
  deletingExpenseId = id;
  document.getElementById("deleteModal").classList.remove("hidden");
}

function closeDeleteModal() {
  deletingExpenseId = null;
  document.getElementById("deleteModal").classList.add("hidden");
}

async function confirmDeleteExpense() {
  if (!deletingExpenseId) return;

  try {
    const res = await fetch(`${BASE_URL}/api/expenses/${deletingExpenseId}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    if (!res.ok) {
      console.error("Delete failed:", res.status);
      return;
    }

    closeDeleteModal();
    await loadExpenses();

  } catch (err) {
    console.error("Delete expense error:", err);
  }
}

/* ================= MODAL UX ================= */

function setupModalUX() {
  const editModal = document.getElementById("editModal");
  const deleteModal = document.getElementById("deleteModal");

  if (editModal) {
    editModal.addEventListener("click", (e) => {
      if (e.target === editModal) closeEditModal();
    });
  }

  if (deleteModal) {
    deleteModal.addEventListener("click", (e) => {
      if (e.target === deleteModal) closeDeleteModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeEditModal();
      closeDeleteModal();
    }
  });
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  applyRoleVisibility();
  setProfileEmail();

  setupModalUX();
  loadExpenses();
});