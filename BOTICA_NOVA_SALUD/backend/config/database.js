
const mongoose = require("mongoose");

const conectarDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MONGODB ATLAS CONECTADO");
        console.log("Base de datos: BOTICA_NOVA_SALUD");

    } catch (error) {
        console.error("Error al conectar MongoDB:", error.message);
        process.exit(1);
    }
};

module.exports = conectarDB;
