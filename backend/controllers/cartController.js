const db = require("../config/database");

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT c.id, c.jumlah,
             b.id AS bibit_id, b.nama_tanaman, b.jenis, b.harga, b.stok, b.gambar
      FROM cart c
      JOIN bibit_tanaman b ON c.bibit_id = b.id
      WHERE c.user_id = ?
      ORDER BY c.id
    `,
      [req.user.id],
    );

    const total = rows.reduce((s, r) => s + parseFloat(r.harga) * r.jumlah, 0);
    res.json({ success: true, data: rows, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/cart  – add or increment
exports.addItem = async (req, res) => {
  const { bibit_id, jumlah = 1 } = req.body;
  if (!bibit_id)
    return res
      .status(400)
      .json({ success: false, message: "bibit_id wajib diisi." });

  try {
    const [[bibit]] = await db.query(
      "SELECT stok FROM bibit_tanaman WHERE id = ?",
      [bibit_id],
    );
    if (!bibit)
      return res
        .status(404)
        .json({ success: false, message: "Produk tidak ditemukan." });

    const [[existing]] = await db.query(
      "SELECT id, jumlah FROM cart WHERE user_id = ? AND bibit_id = ?",
      [req.user.id, bibit_id],
    );

    const newQty = existing
      ? existing.jumlah + parseInt(jumlah)
      : parseInt(jumlah);
    if (newQty > bibit.stok)
      return res
        .status(400)
        .json({
          success: false,
          message: `Stok tidak cukup. Tersisa: ${bibit.stok}`,
        });

    if (existing) {
      await db.query("UPDATE cart SET jumlah = ? WHERE id = ?", [
        newQty,
        existing.id,
      ]);
    } else {
      await db.query(
        "INSERT INTO cart (user_id, bibit_id, jumlah) VALUES (?, ?, ?)",
        [req.user.id, bibit_id, newQty],
      );
    }
    res.json({ success: true, message: "Produk ditambahkan ke keranjang." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/cart/:id
exports.updateItem = async (req, res) => {
  const jumlah = parseInt(req.body.jumlah);
  if (!jumlah || jumlah < 1)
    return res
      .status(400)
      .json({ success: false, message: "Jumlah minimal 1." });

  try {
    const [[item]] = await db.query(
      `
      SELECT c.id, b.stok
      FROM cart c
      JOIN bibit_tanaman b ON c.bibit_id = b.id
      WHERE c.id = ? AND c.user_id = ?
    `,
      [req.params.id, req.user.id],
    );

    if (!item)
      return res
        .status(404)
        .json({ success: false, message: "Item tidak ditemukan." });
    if (jumlah > item.stok)
      return res
        .status(400)
        .json({
          success: false,
          message: `Stok tidak cukup. Tersisa: ${item.stok}`,
        });

    await db.query("UPDATE cart SET jumlah = ? WHERE id = ?", [
      jumlah,
      req.params.id,
    ]);
    res.json({ success: true, message: "Jumlah diperbarui." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/cart/:id
exports.removeItem = async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM cart WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id],
    );
    if (result.affectedRows === 0)
      return res
        .status(404)
        .json({ success: false, message: "Item tidak ditemukan." });
    res.json({ success: true, message: "Item dihapus dari keranjang." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/cart  – clear all
exports.clearCart = async (req, res) => {
  try {
    await db.query("DELETE FROM cart WHERE user_id = ?", [req.user.id]);
    res.json({ success: true, message: "Keranjang dikosongkan." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
