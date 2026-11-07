const express = require("express");
const router = express.Router();

const alertaController = require("../controllers/alertaController");

// Consultar alertas
router.get("/", alertaController.listarAlertas);

// Generar alertas
router.post("/generar", alertaController.generarAlertas);

// Actualizar estado de una alerta
router.patch("/:id/estado", alertaController.actualizarEstadoAlerta);

module.exports = router;