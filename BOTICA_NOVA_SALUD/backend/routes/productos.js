const express = require("express");

const router = express.Router();

const {
    crearProducto,
    listarProductos
} = require("../controllers/productoController");

// Registrar producto
router.post("/", crearProducto);

// Listar productos
router.get("/", listarProductos);

module.exports = router;