/* ============================================================
   payment.js – fake bank transfer payment page
   ============================================================ */

const BANK_NAME = "BCA";
const BANK_NO = "1234567890";
const BANK_HOLDER = "PT GreenSeed Indonesia";
const COUNTDOWN_MINUTES = 15;

let countdownInterval = null;
let orderId = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!requireLogin()) return;
  renderNavAuth();

  const params = new URLSearchParams(window.location.search);
  orderId = params.get("id");
  if (!orderId) {
    window.location.href = "/pages/orders.html";
    return;
  }

  loadOrder();
});

async function loadOrder() {
  try {
    const data = await apiGet("/orders/" + orderId);
    const order = data.data || data.order || data;
    if (order.status !== "pending") {
      showToast("Pesanan ini tidak dalam status menunggu pembayaran", "error");
      setTimeout(() => (window.location.href = "/pages/orders.html"), 1500);
      return;
    }
    renderOrderSummary(order);
    startCountdown(order.created_at);
  } catch (e) {
    showToast("Gagal memuat pesanan", "error");
  }
}

function renderOrderSummary(order) {
  document.getElementById("order-id").textContent = "#" + order.id;
  document.getElementById("order-total").textContent = formatRupiah(
    order.total_harga,
  );
  document.getElementById("order-date").textContent = formatDate(
    order.created_at,
  );

  const ul = document.getElementById("order-items");
  ul.innerHTML = (order.items || [])
    .map(
      (i) => `
    <li class="payment-item">
      <span>${i.nama_tanaman} × ${i.jumlah}</span>
      <span>${formatRupiah(i.harga_satuan * i.jumlah)}</span>
    </li>`,
    )
    .join("");

  document.getElementById("bank-name").textContent = BANK_NAME;
  document.getElementById("bank-no").textContent = BANK_NO;
  document.getElementById("bank-holder").textContent = BANK_HOLDER;
  document.getElementById("transfer-amount").textContent = formatRupiah(
    order.total_harga,
  );
}

function startCountdown(createdAt) {
  const deadline = new Date(
    new Date(createdAt).getTime() + COUNTDOWN_MINUTES * 60 * 1000,
  );

  function tick() {
    const now = new Date();
    const diff = deadline - now;
    if (diff <= 0) {
      clearInterval(countdownInterval);
      document.getElementById("countdown").textContent = "00:00";
      document.getElementById("pay-btn").disabled = true;
      showToast("Waktu pembayaran habis. Pesanan akan dibatalkan.", "error");
      autoCancelOrder();
      return;
    }
    const m = String(Math.floor(diff / 60000)).padStart(2, "0");
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    document.getElementById("countdown").textContent = m + ":" + s;
  }

  tick();
  countdownInterval = setInterval(tick, 1000);
}

async function autoCancelOrder() {
  try {
    await apiPatch("/orders/" + orderId + "/cancel", {});
  } catch (_) {}
  setTimeout(() => (window.location.href = "/pages/orders.html"), 2000);
}

function copyBankNo() {
  navigator.clipboard
    .writeText(BANK_NO)
    .then(() => showToast("Nomor rekening disalin!"));
}

function copyAmount() {
  const raw = document
    .getElementById("transfer-amount")
    .textContent.replace(/[^\d]/g, "");
  navigator.clipboard.writeText(raw).then(() => showToast("Nominal disalin!"));
}

async function payOrder() {
  const btn = document.getElementById("pay-btn");
  btn.disabled = true;
  btn.textContent = "Memproses...";
  clearInterval(countdownInterval);
  try {
    await apiPatch("/orders/" + orderId + "/pay", {});
    showToast("Pembayaran berhasil! Pesanan Anda sedang diproses.");
    setTimeout(() => (window.location.href = "/pages/orders.html"), 1500);
  } catch (e) {
    showToast(e.message || "Gagal konfirmasi pembayaran", "error");
    btn.disabled = false;
    btn.textContent = "✅ Konfirmasi Bayar";
  }
}

async function cancelOrder() {
  if (!confirm("Yakin ingin membatalkan pesanan ini?")) return;
  clearInterval(countdownInterval);
  try {
    await apiPatch("/orders/" + orderId + "/cancel", {});
    showToast("Pesanan dibatalkan.");
    setTimeout(() => (window.location.href = "/pages/orders.html"), 1000);
  } catch (e) {
    showToast(e.message || "Gagal membatalkan pesanan", "error");
  }
}
