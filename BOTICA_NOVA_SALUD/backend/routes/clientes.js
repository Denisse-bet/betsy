const express = require("express");
const router = express.Router();

const {
    crearCliente,
    listarClientes
} = require("../controllers/clienteController");

router.post("/", crearCliente);
router.get("/", listarClientes);

module.exports = router;