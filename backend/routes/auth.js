const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/authController");
const auth = require("../middleware/auth");
const adminMw = require("../middleware/admin");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.get("/me", auth, ctrl.me);
router.get("/users", auth, adminMw, ctrl.getAllUsers);

module.exports = router;
