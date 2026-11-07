const express = require("express");
const router = express.Router();

const {
    crearUsuario,
    listarUsuarios,
    iniciarSesion
} = require("../controllers/usuarioController");

// Iniciar sesión
router.post("/login", iniciarSesion);

// Registrar usuario
router.post("/", crearUsuario);

// Listar usuarios
router.get("/", listarUsuarios);

module.exports = router;