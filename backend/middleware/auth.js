/**
 * Middleware de authentication JWT
 * Este archivo verificaque el usuario tenga token valido
 * Se usa para sus rutas protedgidas que requieren autenticacion
 */

// Importar funciones de JWT
const jwt = { verifyToken, extractToken } = require('../config/jwt');

const { extractToken} = require('../config/jwt');

// Importar modelo de usuario
const Usuario = require('../models/Usuario');

// Middleware de autenticacion
const verificarToken = async (req, res, next) => {
    try {
        // Paso 1: Obtener el token del header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ 
                success: false,
                message: 'No se proporciono token de autenticacion' 
            });
        }

        // Extraer el token quitar Bearer
        const token = extractToken(authHeader);

        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Token de autenticacion invalido' 
            });
        }

        // Paso 2: Verifican que el token sea valido
        let decoded; // Funcion para decodificar el token
        try {
            decoded = verifyToken(token);
        } catch (err) {
            return res.status(401).json({ 
                success: false,
                message: error.message // 'Token de autenticacion invalido'
            });
        }

        // Buscar el usuario en la base de datos 
        const usuario = await User.findById(decoded.id, {
            attributes: { exclude: ['password'] // Excluir el campo password
        });

        if (!usuario) {
            return res.status(404).json({ 
                success: false,
                message: 'Usuario no encontrado' 
            });
        }

        // Paso 4: Verificar que el usuario esta activo
        if (!usuario.activo) {
            return res.status(401).json({ 
                success: false,
                message: 'Usuario inactivo conectese con el administrador' 
            });
        }