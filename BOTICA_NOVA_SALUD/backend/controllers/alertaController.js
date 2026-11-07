
const Producto = require("../models/Producto");
const Alerta = require("../models/Alerta");

// ============================================
// GENERAR ALERTAS AUTOMÁTICAMENTE
// ============================================

const generarAlertas = async (req, res) => {
    try {
        const productos = await Producto.find();
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const limiteVencimiento = new Date(hoy);
        limiteVencimiento.setDate(limiteVencimiento.getDate() + 30);

        let nuevas = 0;

        for (const producto of productos) {

            // ALERTA: PRODUCTO SIN STOCK
            if (Number(producto.stock) <= 0) {
                const existe = await Alerta.findOne({
                    producto: producto._id,
                    tipo: "sin_stock",
                    estado: "pendiente"
                });

                if (!existe) {
                    await Alerta.create({
                        tipo: "sin_stock",
                        producto: producto._id,
                        mensaje: `El producto ${producto.nombre} está sin stock.`,
                        estado: "pendiente"
                    });
                    nuevas++;
                }
            }

            // ALERTA: STOCK BAJO
            else if (Number(producto.stock) <= Number(producto.stockMinimo)) {
                const existe = await Alerta.findOne({
                    producto: producto._id,
                    tipo: "stock_bajo",
                    estado: "pendiente"
                });

                if (!existe) {
                    await Alerta.create({
                        tipo: "stock_bajo",
                        producto: producto._id,
                        mensaje: `${producto.nombre} tiene stock bajo. Stock actual: ${producto.stock}. Mínimo: ${producto.stockMinimo}.`,
                        estado: "pendiente"
                    });
                    nuevas++;
                }
            }

            // ALERTAS: VENCIMIENTO DE LOTES
            if (Array.isArray(producto.lotes)) {
                for (const lote of producto.lotes) {

                    if (!lote.fechaVencimiento || Number(lote.stock) <= 0) {
                        continue;
                    }

                    const vencimiento = new Date(lote.fechaVencimiento);
                    vencimiento.setHours(0, 0, 0, 0);

                    let tipo = null;
                    let mensaje = "";

                    if (vencimiento < hoy) {
                        tipo = "producto_vencido";
                        mensaje = `${producto.nombre}: lote ${lote.numeroLote || "sin número"} vencido.`;
                    } else if (vencimiento <= limiteVencimiento) {
                        tipo = "vencimiento_proximo";
                        mensaje = `${producto.nombre}: lote ${lote.numeroLote || "sin número"} próximo a vencer.`;
                    }

                    if (!tipo) continue;

                    const existe = await Alerta.findOne({
                        producto: producto._id,
                        tipo,
                        fechaVencimiento: vencimiento,
                        estado: "pendiente"
                    });

                    if (!existe) {
                        await Alerta.create({
                            tipo,
                            producto: producto._id,
                            mensaje,
                            fechaVencimiento: vencimiento,
                            estado: "pendiente"
                        });
                        nuevas++;
                    }
                }
            }
        }

        res.status(200).json({
            mensaje: "Revisión de alertas completada.",
            nuevasAlertas: nuevas
        });

    } catch (error) {
        console.error("Error al generar alertas:", error);
        res.status(500).json({
            mensaje: "Error al generar alertas.",
            error: error.message
        });
    }
};


// ============================================
// LISTAR ALERTAS
// ============================================

const listarAlertas = async (req, res) => {
    try {
        const alertas = await Alerta.find()
            .populate("producto", "nombre codigo stock stockMinimo")
            .sort({ createdAt: -1 });

        res.status(200).json(alertas);

    } catch (error) {
        console.error("Error al listar alertas:", error);
        res.status(500).json({
            mensaje: "Error al obtener las alertas.",
            error: error.message
        });
    }
};


// ============================================
// CAMBIAR ESTADO DE UNA ALERTA
// ============================================

const actualizarEstadoAlerta = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const estadosPermitidos = [
            "pendiente",
            "atendida",
            "descartada"
        ];

        if (!estadosPermitidos.includes(estado)) {
            return res.status(400).json({
                mensaje: "Estado de alerta no válido."
            });
        }

        const alerta = await Alerta.findByIdAndUpdate(
            id,
            {
                estado,
                fechaAtencion: estado === "atendida" ? new Date() : null
            },
            { new: true, runValidators: true }
        );

        if (!alerta) {
            return res.status(404).json({
                mensaje: "Alerta no encontrada."
            });
        }

        res.status(200).json({
            mensaje: "Estado de alerta actualizado.",
            alerta
        });

    } catch (error) {
        console.error("Error al actualizar alerta:", error);
        res.status(500).json({
            mensaje: "No se pudo actualizar la alerta.",
            error: error.message
        });
    }
};


module.exports = {
    generarAlertas,
    listarAlertas,
    actualizarEstadoAlerta
};
