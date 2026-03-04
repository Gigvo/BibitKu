const db = require("../config/database");

// GET /api/pelanggan
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM pelanggan ORDER BY id_pelanggan",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/pelanggan/:id
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM pelanggan WHERE id_pelanggan = ?",
      [req.params.id],
    );
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Pelanggan tidak ditemukan" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/pelanggan
exports.create = async (req, res) => {
  const { nama_pelanggan, no_telepon, alamat } = req.body;
  if (!nama_pelanggan || !no_telepon || !alamat)
    return res
      .status(400)
      .json({ success: false, message: "Semua field wajib diisi" });

  try {
    const [result] = await db.query(
      "INSERT INTO pelanggan (nama_pelanggan, no_telepon, alamat) VALUES (?, ?, ?)",
      [nama_pelanggan, no_telepon, alamat],
    );
    res.status(201).json({
      success: true,
      message: "Pelanggan berhasil ditambahkan",
      data: {
        id_pelanggan: result.insertId,
        nama_pelanggan,
        no_telepon,
        alamat,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/pelanggan/:id
exports.update = async (req, res) => {
  const { nama_pelanggan, no_telepon, alamat } = req.body;
  if (!nama_pelanggan || !no_telepon || !alamat)
    return res
      .status(400)
      .json({ success: false, message: "Semua field wajib diisi" });

  try {
    const [result] = await db.query(
      "UPDATE pelanggan SET nama_pelanggan=?, no_telepon=?, alamat=? WHERE id_pelanggan=?",
      [nama_pelanggan, no_telepon, alamat, req.params.id],
    );
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Pelanggan tidak ditemukan" });
    res.json({ success: true, message: "Pelanggan berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/pelanggan/:id
exports.remove = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM pelanggan WHERE id_pelanggan = ?",
      [req.params.id],
    );
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Pelanggan tidak ditemukan" });
    res.json({ success: true, message: "Pelanggan berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
