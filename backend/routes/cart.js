const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/cartController");
const auth = require("../middleware/auth");

router.get("/", auth, ctrl.getCart);
router.post("/", auth, ctrl.addItem);
router.put("/:id", auth, ctrl.updateItem);
router.delete("/", auth, ctrl.clearCart);
router.delete("/:id", auth, ctrl.removeItem);

module.exports = router;
