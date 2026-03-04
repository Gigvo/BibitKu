/* ============================================================
   orders.js – user order history
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  if (!requireLogin()) return;
  if (isAdmin()) {
    window.location.href = "/pages/admin/orders.html";
    return;
  }
  renderNavAuth();
  loadOrders();
});

async function loadOrders() {
  const list = document.getElementById("orders-list");
  try {
    const data = await apiGet("/orders");
    const orders = data.data || data.orders || data;
    if (!Array.isArray(orders) || orders.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div style="font-size:3rem;margin-bottom:1rem">📦</div>
          <h3>Belum ada pesanan</h3>
          <p class="text-muted">Yuk mulai belanja di GreenSeed!</p>
          <a href="/pages/catalog.html" class="btn btn-success mt-2">🛍️ Lihat Katalog</a>
        </div>`;
      return;
    }
    list.innerHTML = orders.map(renderOrderCard).join("");
  } catch (e) {
    list.innerHTML =
      '<p class="text-muted text-center">Gagal memuat pesanan.</p>';
  }
}

function renderOrderCard(order) {
  const isPending = order.status === "pending";
  const isCancelled = order.status === "cancelled";
  const payBtn = isPending
    ? `<a href="/pages/payment.html?id=${order.id}" class="btn btn-success btn-sm">💳 Bayar</a>`
    : "";
  const cancelBtn = isPending
    ? `<button onclick="cancelOrder(${order.id})" class="btn btn-sm" style="background:#fed7d7;color:#c53030">Batalkan</button>`
    : "";

  const itemList = (order.items || [])
    .map(
      (i) =>
        `<div class="order-item-row"><span>${i.nama_tanaman} × ${i.jumlah}</span><span>${formatRupiah(i.harga_satuan * i.jumlah)}</span></div>`,
    )
    .join("");

  return `
  <div class="order-card">
    <div class="order-card-header">
      <div>
        <span class="order-id">Pesanan #${order.id}</span>
        <span style="color:#718096;margin-left:.5rem;font-size:.85rem">${formatDate(order.created_at)}</span>
      </div>
      ${statusBadge(order.status)}
    </div>
    <div class="order-items-list">${itemList}</div>
    <div class="order-card-footer">
      <strong>Total: ${formatRupiah(order.total_harga)}</strong>
      <div style="display:flex;gap:.5rem">${payBtn}${cancelBtn}</div>
    </div>
  </div>`;
}

async function cancelOrder(orderId) {
  if (!confirm("Yakin ingin membatalkan pesanan #" + orderId + "?")) return;
  try {
    await apiPatch("/orders/" + orderId + "/cancel", {});
    showToast("Pesanan #" + orderId + " dibatalkan.");
    loadOrders();
  } catch (e) {
    showToast(e.message || "Gagal membatalkan", "error");
  }
}
