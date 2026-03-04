/* ============================================================
   auth.js – login & register form handlers
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  // Redirect if already logged in
  if (isLoggedIn()) {
    window.location.href = isAdmin()
      ? "/pages/admin/dashboard.html"
      : "/index.html";
    return;
  }

  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Masuk...";
      const email = loginForm.email.value.trim();
      const password = loginForm.password.value;
      try {
        const data = await apiPost("/auth/login", { email, password });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        showToast("Login berhasil! Mengalihkan...");
        setTimeout(() => {
          window.location.href =
            data.user.role === "admin"
              ? "/pages/admin/dashboard.html"
              : "/index.html";
        }, 800);
      } catch (err) {
        showToast(err.message || "Login gagal", "error");
        btn.disabled = false;
        btn.textContent = "Masuk";
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = registerForm.querySelector("button[type=submit]");
      const nama = registerForm.nama.value.trim();
      const email = registerForm.email.value.trim();
      const password = registerForm.password.value;
      const confirm = registerForm.confirm.value;
      if (password !== confirm) {
        showToast("Password tidak cocok", "error");
        return;
      }
      if (password.length < 6) {
        showToast("Password minimal 6 karakter", "error");
        return;
      }
      btn.disabled = true;
      btn.textContent = "Mendaftar...";
      try {
        await apiPost("/auth/register", { nama, email, password });
        showToast("Registrasi berhasil! Silakan login.");
        setTimeout(() => (window.location.href = "/pages/login.html"), 1200);
      } catch (err) {
        showToast(err.message || "Registrasi gagal", "error");
        btn.disabled = false;
        btn.textContent = "Daftar";
      }
    });
  }
});
