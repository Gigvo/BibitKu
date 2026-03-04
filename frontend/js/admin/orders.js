/* ============================================================
   admin/orders.js – admin order management
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAdmin()) return;
  renderNavAuth();
  loadOrders();
  document
    .getElementById("status-filter")
    .addEventListener("change", loadOrders);
});

async function loadOrders() {
  const tbody = document.getElementById("orders-tbody");
  const filter = document.getElementById("status-filter").value;
  tbody.innerHTML =
    '<tr><td colspan="6" class="text-center text-muted">Memuat...</td></tr>';
  try {
    const data = await apiGet("/orders");
    let orders = data.data || data.orders || data;
    if (filter) orders = orders.filter((o) => o.status === filter);
    if (!orders.length) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted">Tidak ada pesanan</td></tr>';
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
        <td>
          <button class="btn btn-sm btn-outline" onclick="viewOrder(${o.id})">👁️ Detail</button>
          ${o.status === "paid" ? `<button class="btn btn-sm btn-success" style="margin-left:.3rem" onclick="completeOrder(${o.id})">✅ Selesai</button>` : ""}
          ${o.status === "pending" ? `<button class="btn btn-sm" style="margin-left:.3rem;background:#fed7d7;color:#c53030" onclick="cancelOrder(${o.id})">❌ Batal</button>` : ""}
        </td>
      </tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted">Gagal memuat</td></tr>';
  }
}

async function viewOrder(id) {
  try {
    const data = await apiGet("/orders/" + id);
    const order = data.data || data.order || data;
    const items = (order.items || [])
      .map(
        (i) =>
          `${i.nama_tanaman} × ${i.jumlah} = ${formatRupiah(i.harga_satuan * i.jumlah)}`,
      )
      .join("\n");
    alert(
      `Pesanan #${order.id}\nPelanggan: ${order.nama_user || "–"}\nStatus: ${order.status}\nTotal: ${formatRupiah(order.total_harga)}\n\nItem:\n${items}`,
    );
  } catch (e) {
    showToast("Gagal memuat detail pesanan", "error");
  }
}

async function completeOrder(id) {
  if (!confirm("Tandai pesanan #" + id + " sebagai Selesai?")) return;
  try {
    // reuse pay endpoint to mark as completed — or use a direct DB update via orders route
    await apiPatch("/orders/" + id + "/complete", {});
    showToast("Pesanan #" + id + " selesai");
    loadOrders();
  } catch (e) {
    showToast(e.message || "Gagal update status", "error");
  }
}

async function cancelOrder(id) {
  if (!confirm("Batalkan pesanan #" + id + "?")) return;
  try {
    await apiPatch("/orders/" + id + "/cancel", {});
    showToast("Pesanan #" + id + " dibatalkan");
    loadOrders();
  } catch (e) {
    showToast(e.message || "Gagal membatalkan", "error");
  }
}
