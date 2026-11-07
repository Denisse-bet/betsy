const express = require("express");

const router = express.Router();

const {
    crearCategoria,
    listarCategorias
} = require("../controllers/categoriaController");

// Registrar categoría
router.post("/", crearCategoria);

// Listar categorías
router.get("/", listarCategorias);

module.exports = router;