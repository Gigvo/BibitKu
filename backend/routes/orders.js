const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/orderController");
const auth = require("../middleware/auth");
const adminMw = require("../middleware/admin");

router.get("/stats", auth, adminMw, ctrl.stats);
router.get("/", auth, ctrl.getAll);
router.get("/:id", auth, ctrl.getById);
router.post("/", auth, ctrl.create);
router.patch("/:id/pay", auth, ctrl.pay);
router.patch("/:id/cancel", auth, ctrl.cancel);
router.patch("/:id/complete", auth, adminMw, ctrl.complete);

module.exports = router;
