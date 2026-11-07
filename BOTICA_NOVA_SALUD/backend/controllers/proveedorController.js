const Proveedor = require("../models/Proveedor");

const crearProveedor = async (req, res) => {
    try {
        const {
            tipoDocumento,
            numeroDocumento,
            razonSocial,
            nombreComercial,
            contacto,
            telefono,
            correo,
            direccion
        } = req.body;

        if (!numeroDocumento || !razonSocial) {
            return res.status(400).json({
                mensaje: "El documento y la razón social son obligatorios"
            });
        }

        const existe = await Proveedor.findOne({ numeroDocumento });

        if (existe) {
            return res.status(400).json({
                mensaje: "El proveedor ya está registrado"
            });
        }

        const proveedor = await Proveedor.create({
            tipoDocumento,
            numeroDocumento,
            razonSocial,
            nombreComercial,
            contacto,
            telefono,
            correo,
            direccion
        });

        res.status(201).json({
            mensaje: "Proveedor registrado correctamente",
            proveedor
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al registrar proveedor",
            error: error.message
        });
    }
};

const listarProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.find()
            .sort({ razonSocial: 1 });

        res.json(proveedores);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al listar proveedores",
            error: error.message
        });
    }
};

module.exports = {
    crearProveedor,
    listarProveedores
};