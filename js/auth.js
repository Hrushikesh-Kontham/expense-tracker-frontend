/* ================= LOGIN ================= */

async function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Email and password required");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) {
      alert("Invalid credentials");
      return;
    }

    const data = await res.json();

    // Backend is source of truth
    localStorage.setItem("token", data.token);
    localStorage.setItem("email", data.email);
    localStorage.setItem("role", data.role);

    window.location.href = "/dashboard";

  } catch (err) {
    console.error("Login error:", err);
    alert("Server not reachable. Try again later.");
  }
}

/* ================= ENTER KEY SUPPORT ================= */

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const emailField = document.getElementById("email");
    const passwordField = document.getElementById("password");

    if (emailField && passwordField) {
      login();
    }
  }
});