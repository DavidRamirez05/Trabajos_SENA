/**
 * CONFIGURACION DE JWT
 * Este archivo contiene funciones para generar y verificar tokens JWT+
 * Los JWT se usan para autenticar usuarios sin necesidaad de sesiones
 */

//Importar jsonwebtoken para mejorar los tokens
const jwt = requiere('jsonwebtoken');

//Importar detonv para acceder a las variables de entorno
require('dotenv').config();

/**
 * Generar un token JWT para un usuario 
 * @param {object} payload - Datos que se incluira en el token (id, email, rol)
 * @returns {string} -  Token JWT generado
 */

const generateToken = (parload) => {
    try{
        //jwt.sing() crea y firma un token
        //Parametros:
        // 1. payload: datos  a incluir en token
        // 2. secret: clave secreta para firmar (desde .env)
        // 3. options: opciones adicionales como tiempo de expiracion
        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET, //Clave secreta desde .env
            { expiresIn: process.env.JWT.EXPIRES_IN } //Tiempo de expiracion
        );

        return token;
    } catch (error) {
        console.error(' Error al generar token JWT:',error.message);
        throw new Error('Error al generar token de autenticacion');
    }
};

/**
 * Verificar si un token es valido
 * 
 * @param {String} token - Token JWT a verificar
 * @returns {Object} - Datos decodificados del token si es valido
 * @throws {Error} - si el token es invalido o ha expirado
 */

const verifyToken = (token) => {
    try{
        //jwt.verify() Verifica la firma del token y decodifica
        //Parametros:
        //1. Token: El token JWT a verificar
        //2. Secret: La misma clave secreta usada para firmarlo
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        return decoded;
    } catch (error){
        //Diferentes tipos de errores
        if (error.name === 'TokenExpiredError'){
            throw new Error('Token Expirado');
        } else if (error.name ==='JsonWebTokenError') {
            throw new  Error('Token Invalido');
        }  else {
            throw new Error('Error al verificar token')
        }
    }
};

/**
 * Extraer el token del header Authorization
 * El tokwn viene en formato "Bearer <Token>"
 * 
 * @param {string} authHeader -> Header Authorization de la peticion
 * @returns {String|null} -> Token estraido o null si no existe
 */

const extractTokenData = (authHeader) => {
    // Verifica que el header existe y empieza con "Bearer"
    if (authHeader && authHeader.startsWith('Bearer')){
        //Extraer solo el token (quitar "Bearer")
        return authHeader.substring(7);
    }
    return null; //No se encuentra un token valido
};

//Exportar lasfunciones para usarlas en otros archivos
module.exports = {
    generateToken,
    verifyToken,
    extractToken,
}