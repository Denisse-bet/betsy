const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");

// Iniciar sesión
const iniciarSesion = async (req, res) => {
    try {
        const { usuario, password } = req.body;

        if (!usuario || !password) {
            return res.status(400).json({
                mensaje: "Ingresa tu usuario y contraseña"
            });
        }

        const usuarioEncontrado = await Usuario.findOne({
            usuario: usuario.trim().toLowerCase()
        }).select("+passwordHash");

        if (!usuarioEncontrado) {
            return res.status(401).json({
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        if (!usuarioEncontrado.estado) {
            return res.status(403).json({
                mensaje: "Tu cuenta está desactivada"
            });
        }

        const passwordCorrecta = await bcrypt.compare(
            password,
            usuarioEncontrado.passwordHash
        );

        if (!passwordCorrecta) {
            return res.status(401).json({
                mensaje: "Usuario o contraseña incorrectos"
            });
        }

        const token = require("jsonwebtoken").sign(
            {
                id: usuarioEncontrado._id,
                rol: usuarioEncontrado.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: "8h" }
        );

        usuarioEncontrado.ultimoAcceso = new Date();
        await usuarioEncontrado.save();

        res.json({
            mensaje: "Inicio de sesión exitoso",
            token,
            usuario: {
                id: usuarioEncontrado._id,
                nombres: usuarioEncontrado.nombres,
                apellidos: usuarioEncontrado.apellidos,
                usuario: usuarioEncontrado.usuario,
                rol: usuarioEncontrado.rol
            }
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al iniciar sesión",
            error: error.message
        });
    }
};

// Registrar usuario
const crearUsuario = async (req, res) => {
    try {
        const {
            nombres,
            apellidos,
            usuario,
            password,
            rol,
            telefono
        } = req.body;

        const existeUsuario = await Usuario.findOne({
            usuario: usuario.toLowerCase()
        });

        if (existeUsuario) {
            return res.status(400).json({
                mensaje: "El nombre de usuario ya existe"
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const nuevoUsuario = await Usuario.create({
            nombres,
            apellidos,
            usuario,
            passwordHash,
            rol,
            telefono
        });

        res.status(201).json({
            mensaje: "Usuario registrado correctamente",
            usuario: {
                id: nuevoUsuario._id,
                nombres: nuevoUsuario.nombres,
                apellidos: nuevoUsuario.apellidos,
                usuario: nuevoUsuario.usuario,
                rol: nuevoUsuario.rol
            }
        });

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al registrar usuario",
            error: error.message
        });
    }
};

// Listar usuarios
const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find()
            .select("-passwordHash")
            .sort({ nombres: 1 });

        res.json(usuarios);

    } catch (error) {
        res.status(500).json({
            mensaje: "Error al listar usuarios",
            error: error.message
        });
    }
};

module.exports = {
    crearUsuario,
    listarUsuarios,
    iniciarSesion
};