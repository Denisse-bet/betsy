const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema(
    {
        nombres: {
            type: String,
            required: true,
            trim: true
        },

        apellidos: {
            type: String,
            required: true,
            trim: true
        },

        usuario: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        rol: {
            type: String,
            enum: [
                "administrador",
                "farmaceutico",
                "vendedor",
                "almacen"
            ],
            required: true,
            default: "vendedor"
        },

        telefono: {
            type: String,
            trim: true,
            default: ""
        },

        estado: {
            type: Boolean,
            default: true
        },

        ultimoAcceso: {
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
    "Usuario",
    usuarioSchema,
    "usuarios"
);