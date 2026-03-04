/* ============================================================
   admin/dashboard.js – admin dashboard stats + recent orders
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAdmin()) return;
  renderNavAuth();
  loadStats();
  loadRecentOrders();
});

async function loadStats() {
  try {
    const resp = await apiGet("/orders/stats");
    const data = resp.data || resp;
    document.getElementById("stat-orders").textContent = data.total_orders || 0;
    document.getElementById("stat-revenue").textContent = formatRupiah(
      data.total_revenue || 0,
    );
    document.getElementById("stat-products").textContent =
      data.total_products || 0;
    document.getElementById("stat-users").textContent = data.total_users || 0;
  } catch (e) {
    console.error(e);
  }
}

async function loadRecentOrders() {
  const tbody = document.getElementById("recent-tbody");
  try {
    const data = await apiGet("/orders");
    const orders = (data.data || data.orders || data).slice(0, 10);
    if (!orders.length) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="text-center text-muted">Belum ada pesanan</td></tr>';
      return;
    }
    tbody.innerHTML = orders
      .map(
        (o) => `
      <tr>
        <td>#${o.id}</td>
        <td>${formatDate(o.created_at)}</td>
        <td>${o.nama_user || o.user_nama || "–"}</td>
        <td>${formatRupiah(o.total_harga)}</td>
        <td>${statusBadge(o.status)}</td>
      </tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted">Gagal memuat</td></tr>';
  }
}
