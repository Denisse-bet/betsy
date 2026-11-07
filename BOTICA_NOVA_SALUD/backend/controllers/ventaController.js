
const mongoose = require("mongoose");
const Venta = require("../models/Venta");
const Producto = require("../models/Producto");
const Usuario = require("../models/Usuario");
const Cliente = require("../models/Cliente");

const registrarVenta = async (req, res) => {
    let session;

    try {
        const {
            cliente,
            nombreCliente,
            usuario,
            detalles,
            descuento = 0,
            metodoPago = "efectivo",
            observacion = ""
        } = req.body;

        if (!usuario || !detalles || !detalles.length) {
            return res.status(400).json({
                mensaje: "Debe indicar usuario y productos de la venta"
            });
        }

        const descuentoNumerico = Number(descuento);

        if (!Number.isFinite(descuentoNumerico) || descuentoNumerico < 0) {
            return res.status(400).json({
                mensaje: "Descuento no válido"
            });
        }

        const metodos = [
            "efectivo",
            "tarjeta",
            "transferencia",
            "yape",
            "plin",
            "mixto"
        ];

        if (!metodos.includes(metodoPago)) {
            return res.status(400).json({
                mensaje: "Método de pago no válido"
            });
        }

        session = await mongoose.startSession();

        let ventaCreada;

        await session.withTransaction(async () => {

            const usuarioExiste = await Usuario.findById(usuario).session(session);

            if (!usuarioExiste) {
                throw new Error("Usuario no encontrado");
            }

            if (cliente) {
                const clienteExiste = await Cliente.findById(cliente).session(session);

                if (!clienteExiste) {
                    throw new Error("Cliente no encontrado");
                }
            }

            let subtotal = 0;
            const detallesVenta = [];
            const productosProcesados = new Set();

            for (const item of detalles) {

                // Aceptar código MED-0001 o ID de MongoDB
                const identificador = String(item.producto || "").trim();

                if (!identificador) {
                    throw new Error("Debe indicar el código del producto");
                }

                let producto;

                if (mongoose.isValidObjectId(identificador)) {
                    producto = await Producto.findById(identificador).session(session);
                } else {
                    producto = await Producto.findOne({
                        codigo: identificador
                    }).session(session);
                }

                if (!producto || !producto.estado) {
                    throw new Error(
                        `Producto no encontrado o inactivo: ${identificador}`
                    );
                }

                // Evitar repetir el mismo producto
                const idProducto = producto._id.toString();

                if (productosProcesados.has(idProducto)) {
                    throw new Error(
                        `El producto ${producto.nombre} está repetido en la venta`
                    );
                }

                productosProcesados.add(idProducto);

                const cantidad = Number(item.cantidad);

                if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
                    throw new Error("Cantidad de producto no válida");
                }

                if (producto.stock < cantidad) {
                    throw new Error(
                        `Stock insuficiente para ${producto.nombre}. Stock disponible: ${producto.stock}`
                    );
                }

                const precioUnitario = producto.precioVenta;
                const importe = precioUnitario * cantidad;

                subtotal += importe;

                // Descontar inventario
                producto.stock -= cantidad;
                await producto.save({ session });

                detallesVenta.push({
                    producto: producto._id,
                    nombreProducto: producto.nombre,
                    cantidad,
                    precioUnitario,
                    subtotal: importe,
                    lote: item.lote || ""
                });
            }

            if (descuentoNumerico > subtotal) {
                throw new Error("El descuento supera el subtotal");
            }

            const total = subtotal - descuentoNumerico;

            const venta = new Venta({
                numeroVenta: `VTA-${Date.now()}`,
                cliente: cliente || null,
                nombreCliente: nombreCliente || "Cliente general",
                usuario,
                detalles: detallesVenta,
                subtotal,
                descuento: descuentoNumerico,
                total,
                metodoPago,
                estado: "completada",
                observacion
            });

            await venta.save({ session });

            ventaCreada = venta;
        });

        res.status(201).json({
            mensaje: "Venta registrada correctamente",
            venta: ventaCreada
        });

    } catch (error) {
        res.status(400).json({
            mensaje: "Error al registrar venta",
            error: error.message
        });

    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

const listarVentas = async (req, res) => {
    try {
        const ventas = await Venta.find()
            .populate("cliente", "nombres apellidos")
            .populate("usuario", "nombres apellidos usuario")
            .populate("detalles.producto", "codigo nombre precioVenta")
            .sort({ createdAt: -1 });

        res.json(ventas);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al listar ventas",
            error: error.message
        });
    }
};

module.exports = {
    registrarVenta,
    listarVentas
};
