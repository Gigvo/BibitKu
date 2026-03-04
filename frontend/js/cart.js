/* ============================================================
   cart.js – shopping cart page
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  if (!requireLogin()) return;
  if (isAdmin()) {
    window.location.href = "/index.html";
    return;
  }
  renderNavAuth();
  loadCart();
});

let cartItems = [];

async function loadCart() {
  const body = document.getElementById("cart-body");
  const empty = document.getElementById("cart-empty");
  const wrap = document.getElementById("cart-wrap");
  try {
    const data = await apiGet("/cart");
    cartItems = data.data || data.items || [];
    if (cartItems.length === 0) {
      wrap.style.display = "none";
      empty.style.display = "block";
      return;
    }
    wrap.style.display = "";
    empty.style.display = "none";
    renderCartItems();
    renderSummary();
  } catch (e) {
    showToast("Gagal memuat keranjang", "error");
  }
}

function renderCartItems() {
  const body = document.getElementById("cart-body");
  body.innerHTML = cartItems
    .map(
      (item) => `
    <div class="cart-item" id="ci-${item.id}">
      <img src="${productImgSrc(item.gambar)}" alt="${item.nama_tanaman}" class="cart-item-img" />
      <div class="cart-item-info">
        <div class="cart-item-name">${item.nama_tanaman}</div>
        <div class="cart-item-price">${formatRupiah(item.harga)}</div>
        ${jenisBadge(item.jenis)}
      </div>
      <div class="cart-item-qty">
        <button class="qty-btn" onclick="changeQty(${item.id}, ${item.jumlah - 1})">−</button>
        <span class="qty-val">${item.jumlah}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, ${item.jumlah + 1})">+</button>
      </div>
      <div class="cart-item-subtotal">${formatRupiah(item.harga * item.jumlah)}</div>
      <button class="btn btn-sm" style="color:#e53e3e;background:none;border:none;font-size:1.2rem;cursor:pointer" onclick="removeItem(${item.id})">🗑️</button>
    </div>
  `,
    )
    .join("");
}

function renderSummary() {
  const total = cartItems.reduce((s, i) => s + i.harga * i.jumlah, 0);
  const count = cartItems.reduce((s, i) => s + i.jumlah, 0);
  document.getElementById("summary-count").textContent = count + " item";
  document.getElementById("summary-total").textContent = formatRupiah(total);
}

async function changeQty(itemId, newQty) {
  if (newQty < 1) {
    removeItem(itemId);
    return;
  }
  try {
    await apiPut("/cart/" + itemId, { jumlah: newQty });
    const item = cartItems.find((i) => i.id === itemId);
    if (item) item.jumlah = newQty;
    renderCartItems();
    renderSummary();
    loadCartCount();
  } catch (e) {
    showToast(e.message || "Gagal update qty", "error");
  }
}

async function removeItem(itemId) {
  try {
    await apiDelete("/cart/" + itemId);
    cartItems = cartItems.filter((i) => i.id !== itemId);
    if (cartItems.length === 0) {
      document.getElementById("cart-wrap").style.display = "none";
      document.getElementById("cart-empty").style.display = "block";
    } else {
      renderCartItems();
      renderSummary();
    }
    loadCartCount();
    showToast("Item dihapus dari keranjang");
  } catch (e) {
    showToast("Gagal menghapus item", "error");
  }
}

async function checkout() {
  const btn = document.getElementById("checkout-btn");
  btn.disabled = true;
  btn.textContent = "Memproses...";
  try {
    const data = await apiPost("/orders", {});
    showToast("Pesanan dibuat! Menuju halaman pembayaran...");
    setTimeout(
      () => (window.location.href = "/pages/payment.html?id=" + data.orderId),
      800,
    );
  } catch (e) {
    showToast(e.message || "Checkout gagal", "error");
    btn.disabled = false;
    btn.textContent = "🛒 Checkout";
  }
}
