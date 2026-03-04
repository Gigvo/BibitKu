const db = require("../config/database");

// GET /api/transaksi
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        t.id_transaksi,
        t.tanggal,
        t.jumlah_beli,
        t.total_harga,
        p.id_pelanggan,
        p.nama_pelanggan,
        p.no_telepon,
        b.id_bibit,
        b.nama_tanaman,
        b.jenis,
        b.harga
      FROM transaksi t
      JOIN pelanggan     p ON t.id_pelanggan = p.id_pelanggan
      JOIN bibit_tanaman b ON t.id_bibit     = b.id_bibit
      ORDER BY t.id_transaksi DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/transaksi/:id
exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT
        t.id_transaksi,
        t.tanggal,
        t.jumlah_beli,
        t.total_harga,
        p.id_pelanggan,
        p.nama_pelanggan,
        p.no_telepon,
        b.id_bibit,
        b.nama_tanaman,
        b.jenis,
        b.harga
      FROM transaksi t
      JOIN pelanggan     p ON t.id_pelanggan = p.id_pelanggan
      JOIN bibit_tanaman b ON t.id_bibit     = b.id_bibit
      WHERE t.id_transaksi = ?
    `,
      [req.params.id],
    );

    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Transaksi tidak ditemukan" });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/transaksi
exports.create = async (req, res) => {
  const { id_pelanggan, id_bibit, jumlah_beli } = req.body;
  if (!id_pelanggan || !id_bibit || !jumlah_beli)
    return res
      .status(400)
      .json({ success: false, message: "Semua field wajib diisi" });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Check stock
    const [[bibit]] = await conn.query(
      "SELECT harga, stok FROM bibit_tanaman WHERE id_bibit = ? FOR UPDATE",
      [id_bibit],
    );
    if (!bibit)
      throw Object.assign(new Error("Bibit tidak ditemukan"), { status: 404 });
    if (bibit.stok < jumlah_beli)
      throw Object.assign(
        new Error(`Stok tidak cukup. Tersisa: ${bibit.stok}`),
        { status: 400 },
      );

    const total_harga = bibit.harga * jumlah_beli;
    const tanggal = new Date().toISOString().slice(0, 10);

    // Insert transaksi
    const [result] = await conn.query(
      "INSERT INTO transaksi (tanggal, id_pelanggan, id_bibit, jumlah_beli, total_harga) VALUES (?, ?, ?, ?, ?)",
      [tanggal, id_pelanggan, id_bibit, jumlah_beli, total_harga],
    );

    // Reduce stock
    await conn.query(
      "UPDATE bibit_tanaman SET stok = stok - ? WHERE id_bibit = ?",
      [jumlah_beli, id_bibit],
    );

    await conn.commit();
    res.status(201).json({
      success: true,
      message: "Transaksi berhasil dibuat",
      data: {
        id_transaksi: result.insertId,
        tanggal,
        id_pelanggan,
        id_bibit,
        jumlah_beli,
        total_harga,
      },
    });
  } catch (err) {
    await conn.rollback();
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

// DELETE /api/transaksi/:id
exports.remove = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[trx]] = await conn.query(
      "SELECT id_bibit, jumlah_beli FROM transaksi WHERE id_transaksi = ?",
      [req.params.id],
    );
    if (!trx) {
      await conn.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Transaksi tidak ditemukan" });
    }

    // Restore stock
    await conn.query(
      "UPDATE bibit_tanaman SET stok = stok + ? WHERE id_bibit = ?",
      [trx.jumlah_beli, trx.id_bibit],
    );

    await conn.query("DELETE FROM transaksi WHERE id_transaksi = ?", [
      req.params.id,
    ]);
    await conn.commit();
    res.json({
      success: true,
      message: "Transaksi berhasil dihapus dan stok dipulihkan",
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};
