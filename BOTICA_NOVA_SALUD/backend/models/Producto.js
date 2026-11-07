
const mongoose = require("mongoose");

// Estructura de los lotes de cada producto
const loteSchema = new mongoose.Schema(
    {
        numeroLote: {
            type: String,
            required: true,
            trim: true
        },

        fechaVencimiento: {
            type: Date,
            required: true
        },

        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        costoUnitario: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { _id: false }
);

// Estructura principal del producto
const productoSchema = new mongoose.Schema(
    {
        codigo: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        codigoBarras: {
            type: String,
            trim: true,
            sparse: true,
            unique: true
        },

        nombre: {
            type: String,
            required: true,
            trim: true
        },

        descripcion: {
            type: String,
            default: ""
        },

        principioActivo: {
            type: String,
            trim: true,
            default: ""
        },

        concentracion: {
            type: String,
            default: ""
        },

        formaFarmaceutica: {
            type: String,
            default: ""
        },

        presentacion: {
            type: String,
            default: ""
        },

        laboratorio: {
            type: String,
            default: ""
        },

        categoria: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Categoria",
            required: true
        },

        precioCompra: {
            type: Number,
            required: true,
            min: 0
        },

        precioVenta: {
            type: Number,
            required: true,
            min: 0
        },

        stock: {
            type: Number,
            default: 0,
            min: 0
        },

        stockMinimo: {
            type: Number,
            default: 5,
            min: 0
        },

        unidadMedida: {
            type: String,
            default: "unidad"
        },

        lotes: {
            type: [loteSchema],
            default: []
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
    "Producto",
    productoSchema,
    "productos"
);
