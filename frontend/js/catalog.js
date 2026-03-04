/* ============================================================
   catalog.js – product catalog, featured grid, product card
   ============================================================ */

// Called from index.html
async function loadFeatured() {
  const grid = document.getElementById("featured-grid");
  if (!grid) return;
  try {
    const data = await apiGet("/products?limit=8");
    const products = data.data || data.products || data;
    if (!Array.isArray(products) || products.length === 0) {
      grid.innerHTML =
        '<p class="text-muted" style="grid-column:1/-1;text-align:center">Belum ada produk.</p>';
      return;
    }
    grid.innerHTML = products.slice(0, 8).map(renderProductCard).join("");
  } catch (e) {
    grid.innerHTML =
      '<p class="text-muted" style="grid-column:1/-1;text-align:center">Gagal memuat produk.</p>';
  }
}

// Called from catalog.html
async function loadCatalog() {
  const grid = document.getElementById("catalog-grid");
  const params = new URLSearchParams(window.location.search);
  const jenis = params.get("jenis") || "";
  const q = params.get("q") || "";

  // Set active filter button
  document.querySelectorAll("[data-jenis]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.jenis === jenis);
  });
  const searchEl = document.getElementById("search-input");
  if (searchEl && q) searchEl.value = q;

  let url = "/products?";
  if (jenis) url += "jenis=" + encodeURIComponent(jenis) + "&";
  if (q) url += "search=" + encodeURIComponent(q) + "&";

  try {
    const data = await apiGet(url);
    const products = data.data || data.products || data;
    if (!Array.isArray(products) || products.length === 0) {
      grid.innerHTML =
        '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:2rem">Tidak ada produk ditemukan.</p>';
      return;
    }
    grid.innerHTML = products.map(renderProductCard).join("");
  } catch (e) {
    grid.innerHTML =
      '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:2rem">Gagal memuat produk.</p>';
  }
}

function renderProductCard(p) {
  return `
  <div class="product-card">
    <a href="/pages/product.html?id=${p.id}" class="product-img-link">
      <img src="${productImgSrc(p.gambar)}" alt="${p.nama_tanaman}" class="product-img" loading="lazy" />
    </a>
    <div class="product-info">
      <div class="product-badges">${jenisBadge(p.jenis)}</div>
      <a href="/pages/product.html?id=${p.id}" class="product-name">${p.nama_tanaman}</a>
      <div class="product-price">${formatRupiah(p.harga)}</div>
      <div class="product-stock ${p.stok < 10 ? "low" : ""}">Stok: ${p.stok}</div>
      <button class="btn btn-success btn-sm mt-1 w-full" onclick="addToCart(${p.id}, '${(p.nama_tanaman || "").replace(/'/g, "\\'")}')">
        🛒 Tambah ke Keranjang
      </button>
    </div>
  </div>`;
}

async function addToCart(productId, name) {
  if (!isLoggedIn()) {
    showToast("Silakan login terlebih dahulu", "error");
    setTimeout(() => (window.location.href = "/pages/login.html"), 1000);
    return;
  }
  if (isAdmin()) {
    showToast("Admin tidak bisa berbelanja", "error");
    return;
  }
  try {
    await apiPost("/cart", { bibit_id: productId, jumlah: 1 });
    showToast(`${name} ditambahkan ke keranjang`);
    loadCartCount();
  } catch (e) {
    showToast(e.message || "Gagal menambahkan ke keranjang", "error");
  }
}

// Search form
function initSearchForm() {
  const form = document.getElementById("search-form");
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = document.getElementById("search-input").value.trim();
    const params = new URLSearchParams(window.location.search);
    if (q) params.set("q", q);
    else params.delete("q");
    window.location.search = params.toString();
  });
}

// Jenis filter links
function initJenisFilter() {
  document.querySelectorAll("[data-jenis]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const jenis = btn.dataset.jenis;
      const params = new URLSearchParams(window.location.search);
      if (jenis) params.set("jenis", jenis);
      else params.delete("jenis");
      params.delete("q");
      window.location.search = params.toString();
    });
  });
}
