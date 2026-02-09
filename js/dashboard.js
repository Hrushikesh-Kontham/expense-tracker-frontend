let currentExpenses = [];
let editingExpenseId = null;
let deleteExpenseId = null;

/* ================= AUTH HELPERS ================= */

function getToken() {
  return localStorage.getItem("token");
}

function authHeaders(json = false) {
  const token = getToken();

  if (!token) {
    logout();
    return {};
  }

  const headers = {
    Authorization: `Bearer ${token}`
  };

  if (json) headers["Content-Type"] = "application/json";

  return headers;
}

/* ================= DASHBOARD SUMMARY ================= */

function updateDashboardSummary(settingsData) {
  const monthlyBudget = Number(settingsData?.monthlyBudget ?? 0);

  const totalSpent = currentExpenses.reduce((sum, e) => {
    return sum + Number(e.amount ?? 0);
  }, 0);

  const remainingBudget = monthlyBudget - totalSpent;

  document.getElementById("monthlyBudget").innerText = monthlyBudget;
  document.getElementById("totalSpent").innerText = totalSpent;
  document.getElementById("remainingBudget").innerText = remainingBudget;
}

async function loadDashboardSummary() {
  try {
    const res = await fetch(`${BASE_URL}/api/user/settings`, {
      headers: authHeaders()
    });

    if (!res.ok) {
      console.warn("Failed to load settings");
      return;
    }

    const settingsData = await res.json();
    updateDashboardSummary(settingsData);

  } catch (err) {
    console.error("Dashboard summary error:", err);
  }
}

/* ================= ADD EXPENSE ================= */

async function addExpense() {
  const titleEl = document.getElementById("title");
  const amountEl = document.getElementById("amount");
  const dateEl = document.getElementById("expenseDate");
  const categoryEl = document.getElementById("category");
  const paymentEl = document.getElementById("paymentMode");
  const formError = document.getElementById("formError");

  const title = titleEl.value.trim();
  const amount = Number(amountEl.value);
  const expenseDate = dateEl.value;
  const category = categoryEl.value;
  const paymentMode = paymentEl.value;

  if (!title || !amountEl.value || !expenseDate || !category || !paymentMode) {
    formError.innerText = "All fields required";
    return;
  }

  if (amount <= 0) {
    formError.innerText = "Amount must be greater than 0";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/expenses`, {
      method: "POST",
      headers: authHeaders(true),
      body: JSON.stringify({
        title,
        amount,
        expenseDate,
        category,
        paymentMode
      })
    });

    if (!res.ok) {
      formError.innerText = "Failed to add expense";
      return;
    }

    // Reset form
    titleEl.value = "";
    amountEl.value = "";
    dateEl.value = "";
    formError.innerText = "";

    await loadExpenses();
    await loadDashboardSummary();

  } catch (err) {
    console.error("Add expense error:", err);
    formError.innerText = "Server error. Try again.";
  }
}

/* ================= LOAD EXPENSES ================= */

async function loadExpenses() {
  const expenseList = document.getElementById("expenseList");
  const emptyState = document.getElementById("emptyState");

  try {
    const res = await fetch(`${BASE_URL}/api/expenses`, {
      headers: authHeaders()
    });

    if (!res.ok) {
      emptyState.style.display = "block";
      expenseList.innerHTML = "";
      return;
    }

    const data = await res.json();

    // Latest first
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    currentExpenses = data;
    expenseList.innerHTML = "";

    if (!data.length) {
      emptyState.style.display = "block";
      return;
    }

    emptyState.style.display = "none";

    // safer + faster rendering
    data.forEach(e => {
      const li = document.createElement("li");

      const leftDiv = document.createElement("div");
      leftDiv.className = "expense-left";

      const titleSpan = document.createElement("span");
      titleSpan.textContent = e.title || "(No title)";

      const small = document.createElement("small");
      small.textContent = `${e.category} • ${e.paymentMode} • ${e.expenseDate}`;

      leftDiv.appendChild(titleSpan);
      leftDiv.appendChild(small);

      const rightDiv = document.createElement("div");
      rightDiv.className = "expense-right";

      const amountSpan = document.createElement("span");
      amountSpan.className = "expense-amount";
      amountSpan.textContent = `₹${e.amount}`;

      const editBtn = document.createElement("button");
      editBtn.className = "edit-btn";
      editBtn.textContent = "Edit";
      editBtn.onclick = () => openEditModal(e.id);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.onclick = () => openDeleteModal(e.id);

      rightDiv.appendChild(amountSpan);
      rightDiv.appendChild(editBtn);
      rightDiv.appendChild(deleteBtn);

      li.appendChild(leftDiv);
      li.appendChild(rightDiv);

      expenseList.appendChild(li);
    });

  } catch (err) {
    console.error("Load expenses error:", err);
    emptyState.style.display = "block";
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
  document.getElementById("editCategory").value = expense.category || "";
  document.getElementById("editPaymentMode").value = expense.paymentMode || "";

  document.getElementById("editError").innerText = "";
  document.getElementById("editModal").classList.remove("hidden");
}

function closeEditModal() {
  editingExpenseId = null;
  document.getElementById("editModal").classList.add("hidden");
}

async function updateExpense() {
  const editError = document.getElementById("editError");

  if (!editingExpenseId) return;

  const title = document.getElementById("editTitle").value.trim();
  const amount = Number(document.getElementById("editAmount").value);
  const expenseDate = document.getElementById("editExpenseDate").value;
  const category = document.getElementById("editCategory").value;
  const paymentMode = document.getElementById("editPaymentMode").value;

  if (!title || !expenseDate || !category || !paymentMode) {
    editError.innerText = "All fields required";
    return;
  }

  if (amount <= 0) {
    editError.innerText = "Amount must be greater than 0";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/expenses/${editingExpenseId}`, {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({
        title,
        amount,
        expenseDate,
        category,
        paymentMode
      })
    });

    if (!res.ok) {
      editError.innerText = "Failed to update expense";
      return;
    }

    closeEditModal();
    await loadExpenses();
    await loadDashboardSummary();

  } catch (err) {
    console.error("Update expense error:", err);
    editError.innerText = "Server error. Try again.";
  }
}

/* ================= DELETE MODAL ================= */

function openDeleteModal(id) {
  deleteExpenseId = id;
  document.getElementById("deleteModal").classList.remove("hidden");
}

function closeDeleteModal() {
  deleteExpenseId = null;
  document.getElementById("deleteModal").classList.add("hidden");
}

async function confirmDeleteExpense() {
  if (!deleteExpenseId) return;

  try {
    const res = await fetch(`${BASE_URL}/api/expenses/${deleteExpenseId}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    if (!res.ok) return;

    closeDeleteModal();
    await loadExpenses();
    await loadDashboardSummary();

  } catch (err) {
    console.error("Delete expense error:", err);
  }
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", async () => {
  requireAuth();
  applyRoleVisibility();
  setProfileEmail();

  setupModalCloseOnOutsideClick();

  await loadExpenses();
  await loadDashboardSummary();
});