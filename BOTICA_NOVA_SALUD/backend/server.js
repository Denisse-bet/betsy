
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const conectarDB = require("./config/database");
const categoriaRoutes = require("./routes/categoriaRoutes");
const productosRoutes = require("./routes/productos");
const movimientosInventarioRoutes = require("./routes/movimientosInventario");
const usuariosRoutes = require("./routes/usuarios");
const ventasRoutes = require("./routes/ventas");
const clientesRoutes = require("./routes/clientes");
const proveedoresRoutes = require("./routes/proveedores");
const alertasRoutes = require("./routes/alertas");
const path = require("path");

// Cargar variables de entorno
dotenv.config({ path: "backend/.env" });
console.log("JWT_SECRET cargado:", Boolean(process.env.JWT_SECRET));
const app = express();

// Configuraciones
app.use(cors());
app.use(express.json());
app.use("/api/categorias", categoriaRoutes);

app.use(cors());
app.use(express.json());
app.use("/api/categorias", categoriaRoutes);
app.use("/api/productos", productosRoutes);

app.use("/api/movimientos-inventario", movimientosInventarioRoutes);

app.use("/api/usuarios", usuariosRoutes);

app.use("/api/ventas", ventasRoutes);

app.use("/api/clientes", clientesRoutes);

app.use("/api/proveedores", proveedoresRoutes);

app.use("/api/alertas", alertasRoutes);

app.use(express.static(path.join(__dirname, "../frontend")));
// Ruta principal
app.get("/", (req, res) => {
    res.json({
        sistema: "BOTICA NOVA SALUD",
        mensaje: "Servidor funcionando correctamente",
        estado: "Activo",
        baseDatos: "MongoDB Atlas"
    });
});

// Iniciar servidor después de conectar MongoDB
const iniciarServidor = async () => {
    try {
        await conectarDB();

        const PORT = process.env.PORT || 3000;

        app.listen(PORT, () => {
            console.log("BOTICA NOVA SALUD");
            console.log(`Servidor: http://localhost:${PORT}`);
            console.log("Estado: ACTIVO");
        });

    } catch (error) {
        console.error("Error al iniciar el sistema:", error.message);
        process.exit(1);
    }
};

iniciarServidor();
