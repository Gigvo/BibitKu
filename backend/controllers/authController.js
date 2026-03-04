const db = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    { id: user.id, nama: user.nama, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

// POST /api/auth/register
exports.register = async (req, res) => {
  const { nama, email, password } = req.body;
  if (!nama || !email || !password)
    return res
      .status(400)
      .json({
        success: false,
        message: "Nama, email, dan password wajib diisi.",
      });
  if (password.length < 6)
    return res
      .status(400)
      .json({ success: false, message: "Password minimal 6 karakter." });

  try {
    const [[existing]] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );
    if (existing)
      return res
        .status(409)
        .json({ success: false, message: "Email sudah terdaftar." });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (nama, email, password, role) VALUES (?, ?, ?, ?)",
      [nama, email, hash, "user"],
    );

    const user = { id: result.insertId, nama, email, role: "user" };
    const token = signToken(user);
    res
      .status(201)
      .json({ success: true, message: "Registrasi berhasil!", token, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ success: false, message: "Email dan password wajib diisi." });

  try {
    const [[user]] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Email atau password salah." });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res
        .status(401)
        .json({ success: false, message: "Email atau password salah." });

    const token = signToken(user);
    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      message: "Login berhasil!",
      token,
      user: safeUser,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.me = async (req, res) => {
  try {
    const [[user]] = await db.query(
      "SELECT id, nama, email, role, created_at FROM users WHERE id = ?",
      [req.user.id],
    );
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User tidak ditemukan." });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/users  (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nama, email, role, created_at FROM users ORDER BY created_at DESC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
