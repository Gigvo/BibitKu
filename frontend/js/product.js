/* ============================================================
   product.js – single product detail page
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  renderNavAuth();
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    window.location.href = "/pages/catalog.html";
    return;
  }
  loadProduct(id);
});

async function loadProduct(id) {
  const wrap = document.getElementById("product-wrap");
  try {
    const data = await apiGet("/products/" + id);
    const p = data.data || data.product || data;

    wrap.innerHTML = `
      <a href="/pages/catalog.html" class="btn btn-outline btn-sm" style="display:inline-block;margin-bottom:1rem">← Kembali ke Katalog</a>
      <div class="product-detail-layout">
        <div class="product-detail-img-wrap">
          <img src="${productImgSrc(p.gambar)}" alt="${p.nama_tanaman}" class="product-detail-img" />
        </div>
        <div class="product-detail-info">
          <div class="product-badges">${jenisBadge(p.jenis)}</div>
          <h1 class="product-detail-name">${p.nama_tanaman}</h1>
          <div class="product-detail-price">${formatRupiah(p.harga)}</div>
          <p class="product-detail-stock ${p.stok < 10 ? "low" : ""}">Stok tersedia: <strong>${p.stok}</strong></p>
          ${p.deskripsi ? `<p class="product-detail-desc">${p.deskripsi}</p>` : ""}
          <div class="product-detail-qty" style="display:flex;align-items:center;gap:1rem;margin:1rem 0">
            <label style="font-weight:600">Jumlah:</label>
            <button class="qty-btn" onclick="changeQty(-1)">−</button>
            <span id="qty-val" style="font-size:1.1rem;font-weight:700;min-width:2rem;text-align:center">1</span>
            <button class="qty-btn" onclick="changeQty(1)">+</button>
          </div>
          <button class="btn btn-success btn-lg w-full" onclick="addToCartDetail(${p.id}, '${(p.nama_tanaman || "").replace(/'/g, "\\'")}', ${p.stok})">
            🛒 Tambah ke Keranjang
          </button>
        </div>
      </div>`;
  } catch (e) {
    wrap.innerHTML =
      '<p class="text-muted text-center">Produk tidak ditemukan.</p>';
  }
}

let qty = 1;

function changeQty(delta) {
  qty = Math.max(1, qty + delta);
  document.getElementById("qty-val").textContent = qty;
}

async function addToCartDetail(productId, name, stok) {
  if (!isLoggedIn()) {
    showToast("Silakan login terlebih dahulu", "error");
    setTimeout(() => (window.location.href = "/pages/login.html"), 1000);
    return;
  }
  if (isAdmin()) {
    showToast("Admin tidak bisa berbelanja", "error");
    return;
  }
  if (qty > stok) {
    showToast("Jumlah melebihi stok tersedia", "error");
    return;
  }
  try {
    await apiPost("/cart", { bibit_id: productId, jumlah: qty });
    showToast(`${name} (×${qty}) ditambahkan ke keranjang`);
    loadCartCount();
  } catch (e) {
    showToast(e.message || "Gagal menambahkan ke keranjang", "error");
  }
}
