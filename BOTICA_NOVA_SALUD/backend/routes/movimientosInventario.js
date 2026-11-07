const express = require("express");
const router = express.Router();

const {
    registrarMovimiento,
    listarMovimientos
} = require("../controllers/movimientoInventarioController");

router.get("/", listarMovimientos);
router.post("/", registrarMovimiento);

module.exports = router;