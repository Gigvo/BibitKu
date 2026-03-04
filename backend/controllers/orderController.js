const db = require("../config/database");

// GET /api/orders  (user → own, admin → all)
exports.getAll = async (req, res) => {
  try {
    let sql = `
      SELECT o.id, o.total_harga, o.status, o.created_at,
             u.id AS user_id, u.nama AS nama_user, u.email,
             COUNT(oi.id) AS total_item
      FROM orders o
      JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
    `;
    const params = [];
    if (req.user.role !== "admin") {
      sql += " WHERE o.user_id = ?";
      params.push(req.user.id);
    }
    sql += " GROUP BY o.id ORDER BY o.created_at DESC";
    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/:id
exports.getById = async (req, res) => {
  try {
    const [[order]] = await db.query(
      `
      SELECT o.*, u.nama AS nama_user, u.email
      FROM orders o JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `,
      [req.params.id],
    );

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order tidak ditemukan." });
    if (req.user.role !== "admin" && order.user_id !== req.user.id)
      return res
        .status(403)
        .json({ success: false, message: "Akses ditolak." });

    const [items] = await db.query(
      `
      SELECT oi.*, b.gambar, b.jenis
      FROM order_items oi
      LEFT JOIN bibit_tanaman b ON oi.bibit_id = b.id
      WHERE oi.order_id = ?
    `,
      [req.params.id],
    );

    res.json({ success: true, data: { ...order, items } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/orders  – checkout from cart
exports.create = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [cartItems] = await conn.query(
      `
      SELECT c.id AS cart_id, c.jumlah,
             b.id AS bibit_id, b.nama_tanaman, b.harga, b.stok
      FROM cart c JOIN bibit_tanaman b ON c.bibit_id = b.id
      WHERE c.user_id = ?
    `,
      [req.user.id],
    );

    if (!cartItems.length)
      throw Object.assign(new Error("Keranjang kosong."), { status: 400 });

    for (const item of cartItems) {
      if (item.jumlah > item.stok)
        throw Object.assign(
          new Error(
            `Stok "${item.nama_tanaman}" tidak cukup. Tersisa: ${item.stok}`,
          ),
          { status: 400 },
        );
    }

    const total_harga = cartItems.reduce(
      (s, i) => s + parseFloat(i.harga) * i.jumlah,
      0,
    );

    const [orderResult] = await conn.query(
      "INSERT INTO orders (user_id, total_harga, status) VALUES (?, ?, ?)",
      [req.user.id, total_harga, "pending"],
    );
    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      await conn.query(
        "INSERT INTO order_items (order_id, bibit_id, nama_tanaman, harga_satuan, jumlah) VALUES (?, ?, ?, ?, ?)",
        [orderId, item.bibit_id, item.nama_tanaman, item.harga, item.jumlah],
      );
      await conn.query(
        "UPDATE bibit_tanaman SET stok = stok - ? WHERE id = ?",
        [item.jumlah, item.bibit_id],
      );
    }

    await conn.query("DELETE FROM cart WHERE user_id = ?", [req.user.id]);
    await conn.commit();

    res.status(201).json({
      success: true,
      message: "Order berhasil dibuat.",
      orderId,
      total_harga,
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

// PATCH /api/orders/:id/pay
exports.pay = async (req, res) => {
  try {
    const [[order]] = await db.query("SELECT * FROM orders WHERE id = ?", [
      req.params.id,
    ]);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order tidak ditemukan." });
    if (req.user.role !== "admin" && order.user_id !== req.user.id)
      return res
        .status(403)
        .json({ success: false, message: "Akses ditolak." });
    if (order.status !== "pending")
      return res.status(400).json({
        success: false,
        message: `Order sudah berstatus: ${order.status}`,
      });

    await db.query("UPDATE orders SET status = 'paid' WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Pembayaran berhasil dikonfirmasi." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/:id/cancel
exports.cancel = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[order]] = await conn.query("SELECT * FROM orders WHERE id = ?", [
      req.params.id,
    ]);
    if (!order)
      throw Object.assign(new Error("Order tidak ditemukan."), { status: 404 });
    if (req.user.role !== "admin" && order.user_id !== req.user.id)
      throw Object.assign(new Error("Akses ditolak."), { status: 403 });
    if (order.status !== "pending")
      throw Object.assign(new Error(`Order sudah berstatus: ${order.status}`), {
        status: 400,
      });

    const [items] = await conn.query(
      "SELECT bibit_id, jumlah FROM order_items WHERE order_id = ?",
      [req.params.id],
    );
    for (const item of items)
      await conn.query(
        "UPDATE bibit_tanaman SET stok = stok + ? WHERE id = ?",
        [item.jumlah, item.bibit_id],
      );

    await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [
      req.params.id,
    ]);
    await conn.commit();
    res.json({
      success: true,
      message: "Order berhasil dibatalkan dan stok dipulihkan.",
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

// PATCH /api/orders/:id/complete  (admin)
exports.complete = async (req, res) => {
  try {
    const [[order]] = await db.query(
      "SELECT id, status FROM orders WHERE id = ?",
      [req.params.id],
    );
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Pesanan tidak ditemukan." });
    if (order.status !== "paid")
      return res
        .status(400)
        .json({ success: false, message: "Pesanan harus berstatus dibayar." });
    await db.query("UPDATE orders SET status = 'completed' WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Pesanan selesai." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/stats  (admin)
exports.stats = async (req, res) => {
  try {
    const [[counts]] = await db.query(`
      SELECT
        COUNT(*)                                   AS total_orders,
        SUM(status = 'paid')                       AS paid,
        SUM(status = 'pending')                    AS pending,
        SUM(status = 'cancelled')                  AS cancelled,
        IFNULL(SUM(CASE WHEN status = 'paid' THEN total_harga ELSE 0 END), 0) AS total_revenue
      FROM orders
    `);
    const [[userCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM users WHERE role = 'user'",
    );
    const [[productCount]] = await db.query(
      "SELECT COUNT(*) AS total FROM bibit_tanaman",
    );
    res.json({
      success: true,
      data: {
        ...counts,
        total_users: userCount.total,
        total_products: productCount.total,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
