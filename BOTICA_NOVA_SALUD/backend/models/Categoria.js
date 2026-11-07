
const mongoose = require("mongoose");

const categoriaSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        descripcion: {
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
    "Categoria",
    categoriaSchema,
    "categorias"
);
