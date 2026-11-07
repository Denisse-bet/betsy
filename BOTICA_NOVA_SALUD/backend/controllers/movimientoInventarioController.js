
const mongoose = require("mongoose");
const MovimientoInventario = require("../models/MovimientoInventario");
const Producto = require("../models/Producto");
const Usuario = require("../models/Usuario");

// =====================================
// BUSCAR PRODUCTO POR ID, CÓDIGO O NOMBRE
// =====================================

const buscarProducto = async (identificador, session) => {
    const valor = String(identificador).trim();

    let productoEncontrado = null;

    // Buscar por ID de MongoDB
    if (mongoose.isValidObjectId(valor)) {
        productoEncontrado = await Producto.findById(valor).session(session);
    }

    // Buscar por código o nombre
    if (!productoEncontrado) {
        const valorSeguro = valor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        productoEncontrado = await Producto.findOne({
            $or: [
                { codigo: valor },
                { nombre: { $regex: `^${valorSeguro}$`, $options: "i" } }
            ]
        }).session(session);
    }

    return productoEncontrado;
};

// =====================================
// REGISTRAR MOVIMIENTO DE INVENTARIO
// =====================================

const registrarMovimiento = async (req, res) => {
    let session;

    try {
        const {
            producto,
            tipoMovimiento,
            cantidad,
            motivo,
            numeroDocumento,
            usuario,
            observacion
        } = req.body;

        if (!producto || !usuario || !motivo) {
            return res.status(400).json({
                mensaje: "Producto, usuario y motivo son obligatorios"
            });
        }

        if (!mongoose.isValidObjectId(usuario)) {
            return res.status(400).json({
                mensaje: "El ID del usuario no es válido"
            });
        }

        if (!["entrada", "salida", "ajuste"].includes(tipoMovimiento)) {
            return res.status(400).json({
                mensaje: "Tipo de movimiento no válido"
            });
        }

        const cantidadNumerica = Number(cantidad);

        if (
            !Number.isSafeInteger(cantidadNumerica) ||
            cantidadNumerica <= 0
        ) {
            return res.status(400).json({
                mensaje: "La cantidad debe ser un número entero mayor que cero"
            });
        }

        session = await mongoose.startSession();

        let movimientoCreado;

        await session.withTransaction(async () => {

            // Buscar producto por ID, código o nombre
            const productoEncontrado = await buscarProducto(
                producto,
                session
            );

            const usuarioEncontrado = await Usuario.findById(usuario)
                .session(session);

            if (!productoEncontrado) {
                const error = new Error(
                    `No se encontró el producto: ${producto}`
                );
                error.status = 404;
                throw error;
            }

            if (!usuarioEncontrado) {
                const error = new Error("Usuario no encontrado");
                error.status = 404;
                throw error;
            }

            if (productoEncontrado.estado === "inactivo") {
                throw new Error("El producto está inactivo");
            }

            const stockAnterior = Number(productoEncontrado.stock);
            let stockNuevo = stockAnterior;

            // Calcular nuevo stock
            if (tipoMovimiento === "entrada") {
                stockNuevo = stockAnterior + cantidadNumerica;
            }

            if (tipoMovimiento === "salida") {
                if (cantidadNumerica > stockAnterior) {
                    throw new Error("Stock insuficiente");
                }

                stockNuevo = stockAnterior - cantidadNumerica;
            }

            if (tipoMovimiento === "ajuste") {
                stockNuevo = cantidadNumerica;
            }

            // Registrar movimiento
            const movimiento = new MovimientoInventario({
                producto: productoEncontrado._id,
                tipoMovimiento,
                cantidad: cantidadNumerica,
                stockAnterior,
                stockNuevo,
                motivo,
                numeroDocumento,
                usuario: usuarioEncontrado._id,
                observacion
            });

            await movimiento.save({ session });

            // Actualizar stock del producto
            productoEncontrado.stock = stockNuevo;
            await productoEncontrado.save({ session });

            movimientoCreado = movimiento;
        });

        return res.status(201).json({
            mensaje: "Movimiento registrado correctamente",
            movimiento: movimientoCreado
        });

    } catch (error) {
        console.error("Error en movimiento de inventario:", error);

        return res.status(error.status || 400).json({
            mensaje: "No se pudo registrar el movimiento",
            error: error.message
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

// =====================================
// LISTAR HISTORIAL DE MOVIMIENTOS
// =====================================

const listarMovimientos = async (req, res) => {
    try {
        const movimientos = await MovimientoInventario.find()
            .populate("producto", "nombre codigo")
            .populate("usuario", "nombres apellidos usuario")
            .sort({ createdAt: -1 });

        return res.status(200).json(movimientos);

    } catch (error) {
        console.error("Error al listar movimientos:", error);

        return res.status(500).json({
            mensaje: "Error al listar movimientos",
            error: error.message
        });
    }
};

// =====================================
// EXPORTAR FUNCIONES
// =====================================

module.exports = {
    registrarMovimiento,
    listarMovimientos
};
