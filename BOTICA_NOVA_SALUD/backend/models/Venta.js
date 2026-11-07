const mongoose = require("mongoose");

const detalleVentaSchema = new mongoose.Schema(
    {
        producto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Producto",
            required: true
        },

        nombreProducto: {
            type: String,
            required: true,
            trim: true
        },

        cantidad: {
            type: Number,
            required: true,
            min: 1
        },

        precioUnitario: {
            type: Number,
            required: true,
            min: 0
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        lote: {
            type: String,
            trim: true,
            default: ""
        }
    },
    {
        _id: false
    }
);

const ventaSchema = new mongoose.Schema(
    {
        numeroVenta: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        cliente: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cliente",
            default: null
        },

        nombreCliente: {
            type: String,
            trim: true,
            default: "Público general"
        },

        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            required: true
        },

        detalles: {
            type: [detalleVentaSchema],
            required: true,
            validate: {
                validator: detalles => detalles.length > 0,
                message: "La venta debe tener al menos un producto."
            }
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        descuento: {
            type: Number,
            default: 0,
            min: 0
        },

        total: {
            type: Number,
            required: true,
            min: 0
        },

        metodoPago: {
            type: String,
            enum: ["efectivo", "tarjeta", "transferencia", "yape", "plin", "mixto"],
            required: true
        },

        estado: {
            type: String,
            enum: ["completada", "anulada"],
            default: "completada"
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
    "Venta",
    ventaSchema,
    "ventas"
);