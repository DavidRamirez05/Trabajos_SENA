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
const verificarAuth = async (req, res, next) => {
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
        } catch (error) {
            return res.status(401).json({ 
                success: false,
                message: error.message // 'Token de autenticacion invalido'
            });
        }

        // Buscar el usuario en la base de datos 
        const usuario = await Usuario.findById(decoded.id, {
            attributes: { exclude: ['password'] } // Excluir el campo password
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

        // Paso 5: Agregar el usuario al objeto req para uso posterior
        // Ahora en los controladores podemos acceder a req.usuario

        //Continuar con el siguiente
        next();

    }   catch (error) {
        console.error('Error en middleware de autenticacion:', error);
        return res.status(500).json({
            success: false,
            message: 'Error en la verificacion del token de autenticacion',
            error: error.message
        });
    }
};

/**
 * Middleware opcional de autenticacion
 * Similar a verificarAuth pero no retomar el error si no hay token
 * Es para rutas que no requieran autenticacion
 */

const verificarAuthOpcional = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Si no hay token, continuar sin usuario
        if (!authHeader) {
            req.usuario = null;
            return next();
        }

        const token = extractToken(authHeader);

        if (!token) {
            req.usuario = null;
            return next();
        }

        try {
            const decoded = verifyToken(token);
            const usuario = await Usuario.findById(decoded.id, {
                attributes: { exclude: ['password'] }
            });
            
            if (usuario && usuario.activo) {
                req.usuario = usuario;
            } else {
                req.usuario = null;
            }
        } catch (error) {
            // Token invalido o expirado, continuar sin usuario
            req.usuario = null;
        }

        next(); 
    } catch (error) {
        console.error('Error en middleware de autenticacion opcional:', error);
        req.usuario = null;
        next();
    }
};

// Exportar los middlewares
module.exports = {
    verificarAuth,
    verificarAuthOpcional
};