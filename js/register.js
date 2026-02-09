// const BASE_URL = "http://localhost:8080";

async function register() {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirmPassword");

  const msg = document.getElementById("registerMsg");
  const btn = document.getElementById("registerBtn");

  msg.innerText = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Validation
  if (!email || !password || !confirmPassword) {
    msg.style.color = "var(--danger)";
    msg.innerText = "All fields are required";
    return;
  }

  if (password.length < 6) {
    msg.style.color = "var(--danger)";
    msg.innerText = "Password must be at least 6 characters";
    return;
  }

  if (password !== confirmPassword) {
    msg.style.color = "var(--danger)";
    msg.innerText = "Passwords do not match";
    return;
  }

  // Disable button while loading
  btn.disabled = true;
  btn.innerText = "Creating Account...";

  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      let errorMsg = "Registration failed";

      try {
        const errData = await res.json();
        if (errData.message) errorMsg = errData.message;
      } catch (e) {}

      msg.style.color = "var(--danger)";
      msg.innerText = errorMsg;

      return;
    }

    msg.style.color = "var(--success)";
    msg.innerText = "✅ Account created successfully. Redirecting to login...";

    emailInput.value = "";
    passwordInput.value = "";
    confirmPasswordInput.value = "";

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);

  } catch (err) {
    msg.style.color = "var(--danger)";
    msg.innerText = "Server error. Please try again.";
  } finally {
    btn.disabled = false;
    btn.innerText = "Create Account";
  }
}

/* ================= ENTER KEY SUPPORT ================= */

document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const emailField = document.getElementById("email");
    const passwordField = document.getElementById("password");
    const confirmField = document.getElementById("confirmPassword");

    if (emailField && passwordField && confirmField) {
      register();
    }
  }
});