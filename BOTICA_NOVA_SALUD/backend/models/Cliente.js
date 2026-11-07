
const mongoose = require("mongoose");

const clienteSchema = new mongoose.Schema(
    {
        tipoDocumento: {
            type: String,
            enum: ["DNI", "RUC", "CE", "OTRO"],
            default: "DNI"
        },

        numeroDocumento: {
            type: String,
            trim: true,
            default: ""
        },

        nombres: {
            type: String,
            required: true,
            trim: true
        },

        apellidos: {
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

        fechaNacimiento: {
            type: Date,
            default: null
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

clienteSchema.index(
    { tipoDocumento: 1, numeroDocumento: 1 },
    {
        unique: true,
        partialFilterExpression: {
            numeroDocumento: { $gt: "" }
        }
    }
);

module.exports = mongoose.model(
    "Cliente",
    clienteSchema,
    "clientes"
);
