const Producto = require("../models/Producto");

// Registrar producto
const crearProducto = async (req, res) => {
    try {
        const {
            codigo,
            codigoBarras,
            nombre,
            descripcion,
            principioActivo,
            concentracion,
            formaFarmaceutica,
            presentacion,
            laboratorio,
            categoria,
            precioCompra,
            precioVenta,
            stock,
            stockMinimo,
            unidadMedida,
            lotes
        } = req.body;

        const existeCodigo = await Producto.findOne({ codigo });

        if (existeCodigo) {
            return res.status(400).json({
                mensaje: "El código del producto ya existe"
            });
        }

        const producto = await Producto.create({
            codigo,
            codigoBarras,
            nombre,
            descripcion,
            principioActivo,
            concentracion,
            formaFarmaceutica,
            presentacion,
            laboratorio,
            categoria,
            precioCompra,
            precioVenta,
            stock,
            stockMinimo,
            unidadMedida,
            lotes
        });

        res.status(201).json({
            mensaje: "Producto registrado correctamente",
            producto
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al registrar producto",
            error: error.message
        });
    }
};

// Listar productos
const listarProductos = async (req, res) => {
    try {
        const productos = await Producto.find()
            .populate("categoria", "nombre")
            .sort({ nombre: 1 });

        res.json(productos);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al listar productos",
            error: error.message
        });
    }
};

module.exports = {
    crearProducto,
    listarProductos
};