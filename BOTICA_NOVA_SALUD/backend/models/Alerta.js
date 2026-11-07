const mongoose = require("mongoose");

const alertaSchema = new mongoose.Schema(
    {
        tipo: {
            type: String,
            enum: [
                "stock_bajo",
                "sin_stock",
                "vencimiento_proximo",
                "producto_vencido"
            ],
            required: true
        },

        producto: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Producto",
            required: true
        },

        mensaje: {
            type: String,
            required: true,
            trim: true
        },

        fechaVencimiento: {
            type: Date,
            default: null
        },

        estado: {
            type: String,
            enum: ["pendiente", "atendida", "descartada"],
            default: "pendiente"
        },

        usuarioResponsable: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario",
            default: null
        },

        fechaAtencion: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports = mongoose.model(
    "Alerta",
    alertaSchema,
    "alertas"
);