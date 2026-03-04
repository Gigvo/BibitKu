/* ============================================================
   api.js – shared utilities: HTTP helpers, auth, UI helpers
   ============================================================ */

const BASE = "http://localhost:3000/api";

// ── Token / User ─────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("token");
}
function getUser() {
  const u = localStorage.getItem("user");
  return u ? JSON.parse(u) : null;
}
function isLoggedIn() {
  return !!getToken();
}
function isAdmin() {
  const u = getUser();
  return u && u.role === "admin";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/index.html";
}

// ── HTTP helpers ─────────────────────────────────────────────
async function apiFetch(method, path, body, isForm = false) {
  const headers = {};
  if (getToken()) headers["Authorization"] = "Bearer " + getToken();
  if (!isForm && body) headers["Content-Type"] = "application/json";

  const opts = { method, headers };
  if (body) opts.body = isForm ? body : JSON.stringify(body);

  const res = await fetch(BASE + path, opts);
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }
  if (!res.ok) throw new Error(data.message || "HTTP " + res.status);
  return data;
}

const apiGet = (path) => apiFetch("GET", path);
const apiPost = (path, body) => apiFetch("POST", path, body);
const apiPut = (path, body) => apiFetch("PUT", path, body);
const apiPatch = (path, body) => apiFetch("PATCH", path, body);
const apiDelete = (path) => apiFetch("DELETE", path);
const apiForm = (method, path, fd) => apiFetch(method, path, fd, true);

// ── Navbar auth rendering ─────────────────────────────────────
function renderNavAuth() {
  const el = document.getElementById("nav-right");
  if (!el) return;
  if (!isLoggedIn()) {
    el.innerHTML = `
      <a href="/pages/login.html"    class="btn btn-outline-white btn-sm">Masuk</a>
      <a href="/pages/register.html" class="btn btn-success btn-sm">Daftar</a>`;
    return;
  }
  const u = getUser();
  const cartBadge = `<a href="/pages/cart.html" class="nav-link cart-link" id="cart-nav">🛒 <span class="cart-badge" id="cart-count" style="display:none">0</span></a>`;
  const adminLink = isAdmin()
    ? `<a href="/pages/admin/dashboard.html" class="btn btn-outline-white btn-sm">Admin</a>`
    : "";
  const ordersLink = !isAdmin()
    ? `<a href="/pages/orders.html" class="nav-link">📦 Pesanan</a>`
    : "";
  el.innerHTML = `
    ${ordersLink}
    ${cartBadge}
    ${adminLink}
    <span class="nav-link" style="cursor:default">👤 ${u.nama}</span>
    <button onclick="logout()" class="btn btn-outline-white btn-sm">Keluar</button>`;

  if (!isAdmin()) loadCartCount();
}

async function loadCartCount() {
  try {
    const data = await apiGet("/cart");
    const items = data.data || data.items || [];
    const count = items.reduce((s, i) => s + i.jumlah, 0);
    const el = document.getElementById("cart-count");
    if (el) {
      el.textContent = count;
      el.style.display = count > 0 ? "inline-block" : "none";
    }
  } catch (_) {}
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type = "success") {
  let c = document.getElementById("toasts");
  if (!c) {
    c = document.createElement("div");
    c.id = "toasts";
    document.body.appendChild(c);
  }
  const t = document.createElement("div");
  t.className = "toast " + type;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ── Formatters ───────────────────────────────────────────────
function formatRupiah(n) {
  return "Rp\u00a0" + Number(n).toLocaleString("id-ID");
}

function formatDate(d) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function jenisBadge(j) {
  const map = {
    Bunga: "badge-pink",
    Buah: "badge-orange",
    Sayuran: "badge-green",
    Herbal: "badge-teal",
    Pohon: "badge-brown",
  };
  return `<span class="badge ${map[j] || "badge-gray"}">${j}</span>`;
}

function productImgSrc(gambar) {
  if (!gambar) return "https://placehold.co/300x200/e8f5e9/2e7d32?text=Bibit";
  if (gambar.startsWith("http")) return gambar;
  return "http://localhost:3000/uploads/" + gambar;
}

function statusBadge(status) {
  const map = {
    pending: "badge-yellow",
    paid: "badge-blue",
    completed: "badge-green",
    cancelled: "badge-red",
  };
  const label = {
    pending: "Menunggu",
    paid: "Dibayar",
    completed: "Selesai",
    cancelled: "Dibatalkan",
  };
  return `<span class="badge ${map[status] || "badge-gray"}">${label[status] || status}</span>`;
}

// ── Guard helpers ────────────────────────────────────────────
function requireLogin(redirect = "/pages/login.html") {
  if (!isLoggedIn()) {
    window.location.href = redirect;
    return false;
  }
  return true;
}
function requireAdmin(redirect = "/index.html") {
  if (!isLoggedIn() || !isAdmin()) {
    window.location.href = redirect;
    return false;
  }
  return true;
}
