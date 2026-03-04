const db = require("../config/database");

// GET /api/bibit
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM bibit_tanaman ORDER BY id_bibit",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/bibit/:id
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM bibit_tanaman WHERE id_bibit = ?",
      [req.params.id],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Bibit tidak ditemukan" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/bibit
exports.create = async (req, res) => {
  const { nama_tanaman, jenis, harga, stok } = req.body;
  if (!nama_tanaman || !jenis || harga == null || stok == null)
    return res
      .status(400)
      .json({ success: false, message: "Semua field wajib diisi" });

  try {
    const [result] = await db.query(
      "INSERT INTO bibit_tanaman (nama_tanaman, jenis, harga, stok) VALUES (?, ?, ?, ?)",
      [nama_tanaman, jenis, harga, stok],
    );
    res.status(201).json({
      success: true,
      message: "Bibit berhasil ditambahkan",
      data: { id_bibit: result.insertId, nama_tanaman, jenis, harga, stok },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/bibit/:id
exports.update = async (req, res) => {
  const { nama_tanaman, jenis, harga, stok } = req.body;
  if (!nama_tanaman || !jenis || harga == null || stok == null)
    return res
      .status(400)
      .json({ success: false, message: "Semua field wajib diisi" });

  try {
    const [result] = await db.query(
      "UPDATE bibit_tanaman SET nama_tanaman=?, jenis=?, harga=?, stok=? WHERE id_bibit=?",
      [nama_tanaman, jenis, harga, stok, req.params.id],
    );
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Bibit tidak ditemukan" });
    res.json({ success: true, message: "Bibit berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/bibit/:id
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM bibit_tanaman WHERE id_bibit = ?",
      [req.params.id],
    );
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Bibit tidak ditemukan" });
    res.json({ success: true, message: "Bibit berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
