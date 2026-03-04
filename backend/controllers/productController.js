const db = require("../config/database");

// GET /api/products  (public) – ?jenis=, ?search=
exports.getAll = async (req, res) => {
  try {
    let sql = "SELECT * FROM bibit_tanaman WHERE 1=1";
    const params = [];
    if (req.query.jenis) {
      sql += " AND jenis = ?";
      params.push(req.query.jenis);
    }
    if (req.query.search) {
      sql += " AND (nama_tanaman LIKE ? OR deskripsi LIKE ?)";
      params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }
    sql += " ORDER BY created_at DESC";
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/products/:id  (public)
exports.getById = async (req, res) => {
  try {
    const [[row]] = await db.query("SELECT * FROM bibit_tanaman WHERE id = ?", [
      req.params.id,
    ]);
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan." });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/products  (admin only) – JSON body with optional image URL
exports.create = async (req, res) => {
  const { nama_tanaman, jenis, deskripsi, harga, stok, gambar } = req.body;
  if (!nama_tanaman || !jenis || harga == null || stok == null)
    return res
      .status(400)
      .json({ success: false, message: "Semua field wajib diisi." });
  try {
    const [result] = await db.query(
      "INSERT INTO bibit_tanaman (nama_tanaman, jenis, deskripsi, harga, stok, gambar) VALUES (?, ?, ?, ?, ?, ?)",
      [
        nama_tanaman,
        jenis,
        deskripsi || null,
        parseFloat(harga),
        parseInt(stok),
        gambar,
      ],
    );
    res.status(201).json({
      success: true,
      message: "Produk berhasil ditambahkan.",
      id: result.insertId,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/products/:id  (admin only) – JSON body with optional image URL
exports.update = async (req, res) => {
  const { nama_tanaman, jenis, deskripsi, harga, stok, gambar } = req.body;
  if (!nama_tanaman || !jenis || harga == null || stok == null)
    return res
      .status(400)
      .json({ success: false, message: "Semua field wajib diisi." });

  try {
    const [[existing]] = await db.query(
      "SELECT id FROM bibit_tanaman WHERE id = ?",
      [req.params.id],
    );
    if (!existing)
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan." });

    await db.query(
      "UPDATE bibit_tanaman SET nama_tanaman=?, jenis=?, deskripsi=?, harga=?, stok=?, gambar=? WHERE id=?",
      [
        nama_tanaman,
        jenis,
        deskripsi || null,
        parseFloat(harga),
        parseInt(stok),
        gambar,
        req.params.id,
      ],
    );
    res.json({ success: true, message: "Produk berhasil diperbarui." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/products/:id  (admin only)
exports.remove = async (req, res) => {
  try {
    const [[row]] = await db.query(
      "SELECT gambar FROM bibit_tanaman WHERE id = ?",
      [req.params.id],
    );
    if (!row)
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan." });

    const [[used]] = await db.query(
      "SELECT id FROM order_items WHERE bibit_id = ? LIMIT 1",
      [req.params.id],
    );
    if (used)
      return res.status(400).json({
        success: false,
        message:
          "Produk tidak dapat dihapus karena sudah ada dalam riwayat order.",
      });

    await db.query("DELETE FROM bibit_tanaman WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Produk berhasil dihapus." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
