const express = require("express");
const router = express.Router();

const {
    registrarVenta,
    listarVentas
} = require("../controllers/ventaController");

router.post("/", registrarVenta);
router.get("/", listarVentas);

module.exports = router;