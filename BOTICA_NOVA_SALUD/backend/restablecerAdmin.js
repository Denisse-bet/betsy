const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const conectarDB = require("./config/database");
const Usuario = require("./models/Usuario");

dotenv.config({ path: "backend/.env" });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function restablecer() {
    try {
        const password = await new Promise(resolve => {
            rl.question("Ingresa la nueva contraseña: ", resolve);
        });

        if (!password || password.length < 8) {
            console.log("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        await conectarDB();

        const passwordHash = await bcrypt.hash(password, 12);

        const usuario = await Usuario.findOneAndUpdate(
            { usuario: "admin" },
            { passwordHash },
            { new: true }
        );

        if (!usuario) {
            console.log("No se encontró el administrador.");
            return;
        }

        console.log("Contraseña restablecida correctamente.");
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        rl.close();
        process.exit();
    }
}

restablecer();