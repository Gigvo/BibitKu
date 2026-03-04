/* ============================================================
   admin/products.js – product CRUD management
   ============================================================ */

let editingId = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAdmin()) return;
  renderNavAuth();
  loadProducts();
  document
    .getElementById("product-form")
    .addEventListener("submit", saveProduct);
  document.getElementById("img-file").addEventListener("change", previewImage);
});

async function loadProducts() {
  const tbody = document.getElementById("products-tbody");
  tbody.innerHTML =
    '<tr><td colspan="7" class="text-center text-muted">Memuat...</td></tr>';
  try {
    const data = await apiGet("/products");
    const products = data.data || data.products || data;
    if (!products.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center text-muted">Belum ada produk</td></tr>';
      return;
    }
    tbody.innerHTML = products
      .map(
        (p) => `
      <tr>
        <td>${p.id}</td>
        <td><img src="${productImgSrc(p.gambar)}" style="width:50px;height:40px;object-fit:cover;border-radius:4px" /></td>
        <td>${p.nama_tanaman}</td>
        <td>${jenisBadge(p.jenis)}</td>
        <td>${formatRupiah(p.harga)}</td>
        <td>${p.stok}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="editProduct(${p.id})" style="margin-right:.3rem">✏️ Edit</button>
          <button class="btn btn-sm" style="background:#fed7d7;color:#c53030" onclick="deleteProduct(${p.id})">🗑️ Hapus</button>
        </td>
      </tr>`,
      )
      .join("");
  } catch (e) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted">Gagal memuat</td></tr>';
  }
}

function showModal(title) {
  document.getElementById("modal-title").textContent = title;
  document.getElementById("product-modal").style.display = "flex";
}

function closeModal() {
  document.getElementById("product-modal").style.display = "none";
  document.getElementById("product-form").reset();
  document.getElementById("img-preview").style.display = "none";
  editingId = null;
}

function openAddModal() {
  editingId = null;
  document.getElementById("product-form").reset();
  document.getElementById("img-preview").style.display = "none";
  showModal("Tambah Produk Baru");
}

async function editProduct(id) {
  try {
    const data = await apiGet("/products/" + id);
    const p = data.data || data.product || data;
    editingId = p.id;
    document.getElementById("f-nama").value = p.nama_tanaman;
    document.getElementById("f-jenis").value = p.jenis;
    document.getElementById("f-harga").value = p.harga;
    document.getElementById("f-stok").value = p.stok;
    document.getElementById("f-desc").value = p.deskripsi || "";
    const prev = document.getElementById("img-preview");
    prev.src = productImgSrc(p.gambar);
    prev.style.display = "block";
    showModal("Edit Produk");
  } catch (e) {
    showToast("Gagal memuat data produk", "error");
  }
}

function previewImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const prev = document.getElementById("img-preview");
  prev.src = URL.createObjectURL(file);
  prev.style.display = "block";
}

async function saveProduct(e) {
  e.preventDefault();
  const btn = document.getElementById("save-btn");
  btn.disabled = true;
  btn.textContent = "Menyimpan...";

  const fd = new FormData();
  fd.append("nama_tanaman", document.getElementById("f-nama").value.trim());
  fd.append("jenis", document.getElementById("f-jenis").value);
  fd.append("harga", document.getElementById("f-harga").value);
  fd.append("stok", document.getElementById("f-stok").value);
  fd.append("deskripsi", document.getElementById("f-desc").value.trim());
  const imgFile = document.getElementById("img-file").files[0];
  if (imgFile) fd.append("gambar", imgFile);

  try {
    if (editingId) {
      await apiForm("PUT", "/products/" + editingId, fd);
      showToast("Produk berhasil diperbarui");
    } else {
      await apiForm("POST", "/products", fd);
      showToast("Produk berhasil ditambahkan");
    }
    closeModal();
    loadProducts();
  } catch (err) {
    showToast(err.message || "Gagal menyimpan produk", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Simpan";
  }
}

async function deleteProduct(id) {
  if (!confirm("Yakin ingin menghapus produk ini?")) return;
  try {
    await apiDelete("/products/" + id);
    showToast("Produk dihapus");
    loadProducts();
  } catch (e) {
    showToast(e.message || "Gagal menghapus produk", "error");
  }
}
