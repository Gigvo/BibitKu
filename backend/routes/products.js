const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/productController");
const auth = require("../middleware/auth");
const adminMw = require("../middleware/admin");
const upload = require("../middleware/upload");

// Public
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);

// Admin only – use upload.single('gambar') for image handling
router.post("/", auth, adminMw, upload.single("gambar"), ctrl.create);
router.put("/:id", auth, adminMw, upload.single("gambar"), ctrl.update);
router.delete("/:id", auth, adminMw, ctrl.remove);

module.exports = router;
