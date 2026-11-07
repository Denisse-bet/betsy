const Cliente = require("../models/Cliente");

const crearCliente = async (req, res) => {
    try {
        const {
            tipoDocumento,
            numeroDocumento,
            nombres,
            apellidos,
            telefono,
            correo,
            direccion
        } = req.body;

        if (!nombres) {
            return res.status(400).json({
                mensaje: "Los nombres son obligatorios"
            });
        }

        if (numeroDocumento) {
            const existe = await Cliente.findOne({
                tipoDocumento,
                numeroDocumento
            });

            if (existe) {
                return res.status(400).json({
                    mensaje: "El documento ya está registrado"
                });
            }
        }

        const cliente = await Cliente.create({
            tipoDocumento,
            numeroDocumento: numeroDocumento || undefined,
            nombres,
            apellidos,
            telefono,
            correo,
            direccion
        });

        res.status(201).json({
            mensaje: "Cliente registrado correctamente",
            cliente
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al registrar cliente",
            error: error.message
        });
    }
};

const listarClientes = async (req, res) => {
    try {
        const clientes = await Cliente.find().sort({ nombres: 1 });
        res.json(clientes);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al listar clientes",
            error: error.message
        });
    }
};

module.exports = {
    crearCliente,
    listarClientes
};