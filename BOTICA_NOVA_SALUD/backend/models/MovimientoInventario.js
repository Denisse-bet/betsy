const mongoose = require("mongoose");

const movimientoInventarioSchema = new mongoose.Schema(
    {
        producto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Producto",
            required: true
        },

        tipoMovimiento: {
            type: String,
            enum: ["entrada", "salida", "ajuste"],
            required: true
        },

        cantidad: {
            type: Number,
            required: true,
            min: 1
        },

        stockAnterior: {
            type: Number,
            required: true,
            min: 0
        },

        stockNuevo: {
            type: Number,
            required: true,
            min: 0
        },

        motivo: {
            type: String,
            required: true,
            trim: true
        },

        numeroDocumento: {
            type: String,
            trim: true,
            default: ""
        },

        proveedor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Proveedor",
            default: null
        },

        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: true
        },
        observacion: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports = mongoose.model(
    "MovimientoInventario",
    movimientoInventarioSchema,
    "movimientos_inventario"
);
