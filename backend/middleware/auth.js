const jwt = require("jsonwebtoken");

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer "))
    return res
      .status(401)
      .json({
        success: false,
        message: "Token tidak ditemukan. Silakan login.",
      });

  try {
    req.user = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Token tidak valid atau sudah kadaluarsa.",
      });
  }
};
