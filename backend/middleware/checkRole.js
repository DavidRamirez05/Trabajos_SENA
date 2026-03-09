/**
 * Middlware de verificar roles
 * Este middleware verifica que el usuario tenga un rol requerido
 * Debe usarse despues de middleware de autenticacion
 */

const esAdmintrador = (req, res, next) => {
    try {
        // Verifica que existe req.usuario (Viene de la autenticacion)
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado debes iniciar sesion primero'
            });
        }

        // Verifica que el usuario tenga el rol de administrador
        if (req.usuario.rol !== 'administrador') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requiere permisos de administrador'
            });
        }

        // El usuario es administrador continuar
        next();

    } catch (error) {
        console.error('Error en middleware esAdministrador:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
};

/**
 * Middleware para verificar si el usuario es cliente
 */
const esCliente = (req, res, next) => {
    try {
        // Verifica que existe req.usuario (Viene de la autenticacion)
        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                message: 'No autorizado debes iniciar sesion primero'
            });
        }

        // Verifica que el usuario tenga el rol de cliente
        if (req.usuario.rol !== 'cliente') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Se requiere uno de los siguientes roles: ${rolesPermtidos.join(', ')}'
            });
        }

        // El usuario es cliente continuar
        next();

    } catch (error) {
        console.error('Error en middleware esCliente:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al verificar permisos',
            error: error.message
        });
    }
};

/**
 * Middleware flexible para verficar multiples roles
 * Permite verificar varios roles validos 
 * Util para cuadno una ruta tiene varios roles permitidos
 */
const tieneRol = (req, res, next) => {
    return (req, res, next) => {
        try {
            // Verifica que existe req.usuario (Viene de la autenticacion)
            if (!req.usuario) {
                return res.status(401).json({
                success: false,
                message: 'No autorizado debes iniciar sesion primero'
            });
        }

            // Verifica que el usuario tenga uno de los roles permitidos
            if (!roles.includes(req.usuario.rol)) {
                return res.status(403).json({
                    success: false,
                    message: 'Acceso denegado. No tienes permisos para esta ruta'
                });
            }

            // El usuario tiene uno de los roles permitidos, continuar
            next();
        } catch (error) {
            console.error('Error en middleware tieneRol:', error);
            return res.status(500).json({
                success: false,
                message: 'Error al verificar permisos',
                error: error.message
            });
        }
    };
};