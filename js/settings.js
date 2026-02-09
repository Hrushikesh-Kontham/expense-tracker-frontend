async function loadSettings() {
  const msg = document.getElementById("settingsMsg");

  try {
    const res = await fetch(`${BASE_URL}/api/user/settings`, {
      headers: authHeaders()
    });

    if (!res.ok) {
      if (msg) {
        msg.innerText = "Failed to load settings";
        msg.style.color = "var(--danger)";
      }
      return;
    }

    const data = await res.json();

    document.getElementById("budgetInput").value = data.monthlyBudget ?? "";
    document.getElementById("currencySelect").value = data.currency ?? "INR";

    if (msg) msg.innerText = "";

  } catch (err) {
    console.error("Load settings error:", err);

    if (msg) {
      msg.innerText = "Something went wrong while loading settings";
      msg.style.color = "var(--danger)";
    }
  }
}

async function saveSettings() {
  const msg = document.getElementById("settingsMsg");

  const monthlyBudgetValue = document.getElementById("budgetInput").value;
  const currency = document.getElementById("currencySelect").value;

  const monthlyBudget = Number(monthlyBudgetValue);

  if (!monthlyBudgetValue || isNaN(monthlyBudget) || monthlyBudget <= 0) {
    msg.innerText = "Enter a valid monthly budget";
    msg.style.color = "var(--danger)";
    return;
  }

  if (!currency) {
    msg.innerText = "Select a valid currency";
    msg.style.color = "var(--danger)";
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/user/settings`, {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({
        monthlyBudget,
        currency
      })
    });

    if (!res.ok) {
      msg.innerText = "Failed to save settings";
      msg.style.color = "var(--danger)";
      return;
    }

    msg.innerText = "Settings updated successfully ✅";
    msg.style.color = "var(--success)";

    // auto clear after 3 sec
    setTimeout(() => {
      msg.innerText = "";
    }, 3000);

  } catch (err) {
    console.error("Save settings error:", err);

    msg.innerText = "Something went wrong while saving";
    msg.style.color = "var(--danger)";
  }
}

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  applyRoleVisibility();
  setProfileEmail();
  loadSettings();
});