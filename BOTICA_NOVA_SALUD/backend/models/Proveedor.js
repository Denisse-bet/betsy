
const mongoose = require("mongoose");

const proveedorSchema = new mongoose.Schema(
    {
        tipoDocumento: {
            type: String,
            enum: ["RUC", "DNI", "CE"],
            required: true
        },

        numeroDocumento: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        razonSocial: {
            type: String,
            required: true,
            trim: true
        },

        nombreComercial: {
            type: String,
            trim: true,
            default: ""
        },

        contacto: {
            type: String,
            trim: true,
            default: ""
        },

        telefono: {
            type: String,
            trim: true,
            default: ""
        },

        correo: {
            type: String,
            trim: true,
            lowercase: true,
            default: ""
        },

        direccion: {
            type: String,
            trim: true,
            default: ""
        },

        estado: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

module.exports = mongoose.model(
    "Proveedor",
    proveedorSchema,
    "proveedores"
);
