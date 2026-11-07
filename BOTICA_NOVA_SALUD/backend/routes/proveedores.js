const express = require("express");
const router = express.Router();

const {
    crearProveedor,
    listarProveedores
} = require("../controllers/proveedorController");

router.post("/", crearProveedor);
router.get("/", listarProveedores);

module.exports = router;