const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/productController");
const auth = require("../middleware/auth");
const adminMw = require("../middleware/admin");
const upload = require("../middleware/upload");

// Public
router.get("/", ctrl.getAll);
router.get("/:id", ctrl.getById);

// Admin only – gambar is a URL string in JSON body
router.post("/", auth, adminMw, ctrl.create);
router.put("/:id", auth, adminMw, ctrl.update);
router.delete("/:id", auth, adminMw, ctrl.remove);

module.exports = router;
