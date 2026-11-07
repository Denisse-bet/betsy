const Categoria = require("../models/Categoria");

// Registrar categoría
const crearCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        const existe = await Categoria.findOne({ nombre });

        if (existe) {
            return res.status(400).json({
                mensaje: "La categoría ya existe"
            });
        }

        const categoria = await Categoria.create({
            nombre,
            descripcion
        });

        res.status(201).json({
            mensaje: "Categoría registrada correctamente",
            categoria
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al registrar categoría",
            error: error.message
        });
    }
};

// Listar categorías
const listarCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find().sort({ nombre: 1 });

        res.json(categorias);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al obtener categorías",
            error: error.message
        });
    }
};

module.exports = {
    crearCategoria,
    listarCategorias
};