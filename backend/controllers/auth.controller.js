/**
 * Controller de autenticacion
 * Maneja elregistro,login y obtencion del perfil del usuario
 */

/**
 * Importar modelos
 */

const Usuario = require('../models/Usuario');
const { generateToken } = require('../config/jwt');

/**
 * Obtener todos los usuarios
 * GET /api/usuarios
 * query params: 
 * Activo true/false (filtrar por estado)
 * 
 * @param {Object} req request Express
 * @param {Object} res responde Express
 */

const registrar = async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, direccion } = req.body;

        //Validacion 1: Verifica que todos los campos requeridos estén presentes
        if (!nombre || !apellido || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: nombre, apellido, email, password'
            });
        }
            
        //Validacion 2: Verifica el formato del email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email no válido'
            });
        }

        //Validacion 3: Verifica la longitud de la contraseña        
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres' 
            });
        }

        //Validacion 4: Verifica que el email no esté registrado
        const usuarioExistente = await Usuario.findOne({ where: { email } });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                message: 'El email ya está registrado'
            });
        }
    
/**
 * Crear Usuario
 * El hook beforeCreate en el modelo Usuario se encargará de hashear la contraseña antes de guardarla
 * En el rol por defecto es cliente
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

            //crear usuario
            const nuevoUsuario = await Usuario.create({
                nombre,
                apellido,
                email,
                password,
                telefono: telefono || null,
                direccion: direccion || null, // si no se proporciona se establece como null
                rol: 'cliente', // rol por defecto
            });

            //Generar token JWT con datos del usuario
            const token = generateToken({
                id: nuevoUsuario.id,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.rol
            });

            //Respuesta exitosa
            const usuarioRespuesta = nuevoUsuario.toJSON();
            delete usuarioRespuesta.password; // Eliminar el campo de contraseña de la respuesta
            res.status(201).json({
                success: true,
                message: 'Usuario registrado correctamente',
                data: {
                    usuario: usuarioRespuesta,
                    token
                }   
            });
        } catch (error) {
                console.error('Error en registrar: ', error);
                    return res.status(400).json({
                        success: false,
                        message: 'Error al registrar usuario',
                        errors: error.errors.map(e => e.message)
                    });
                }
        };

/** 
 * Iniciar sesion login
 * Autentica un usuario con email y password
 * Retorna el usuario y un token JWT si las credenciales son correctas
 * POST/api/auth/login
 * body: {email, password}
 */

const login = async (req, res) => { 
    try {
        // Extraer credenciales del body
        const { email, password } = req.body;

        // Validacion 1: Verificar que se proporcioonaron email y password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Faltan campos requeridos: email, password'
            });
        }

        // Validacion 2: Buscar usuario por email
        // Necesitamos incluir el password aqui normalmente se excluye por seguridad
        const usuario = await Usuario.scope('withPassword').findOne({ 
            where: { email } 
        });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
    
        // Validacion 3: Verificar que el usuario esta activo
        if (!usuario.activo) {
            return res.status(403).json({
                success: false,
                message: 'Usuario inactivo. Contacta al administrador.'
            });
        }

        // Validacion 4: Verificar la contraseña
        // Usamos el metodo comparar Password del modelo usuario
        const passwordValida = await usuario.compararPassword(password);

        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token JWT con datos basicos del usuario
        const token = generateToken({
            id: usuario.id,
            email: usuario.email,
            rol: usuario.rol
        });
        
        // Preparar respuesta si password
        const usuarioSinPassword = usuario.toJSON();
        delete usuarioSinPassword.password;

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Inicio de sesion exitosa',
            data: {
                usuario: usuarioSinPassword,
                token
            },
        });
    } catch (error) {
        console.error('Error en login: ', error);
        res.status(500).json({
            success: false,
            message: 'Error en login',
            error: error.message
        });
    }
};

/**
 * Obtener perfil del usuario autenticado
 * Requiere middleware verificarAuth 
 * GET /api/auth/profile
 * headers: { Authorization: 'Bearer TOKEN' }
 */
const getMe = async (req, res) => {
    try {
        // El usuario ya esta en req.usuario
        const usuario = await Usuario.findByPk(req.usuario.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Perfil obtenido correctamente',
            data: {
                usuario
            }
        });
    } catch (error) {
        console.error('Error en getMe: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el perfil',
            error: error.message
        });
    }
};

/**
 * Actualizar perfil de usuario autenticado
 * Permite al usuario actualizar su informacion personal
 * PUT/api/auth/me
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const updateMe = async (req, res) => {
    try {
        const {nombre, apellido, telefono, direccion} = req.body;

        //Buscar usuario
        const usuario = await Usuario.findByPk(req.usuario.id);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        //Actualizar campos
        if (nombre !== undefined) usuario.nombre = nombre;
        if (apellido !== undefined) usuario.apellido = apellido;
        if (telefono !== undefined) usuario.telefono = telefono;
        if (direccion !== undefined) usuario.direccion = direccion;

        //guardar cambios 
        await usuario.save();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            data: {
                usuario: usuario.toJSON()
            }
        });
    } catch (error) {
        console.error('Error en actualizar Perfil: ', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar perfil',
            error: error.message
        });
    }
};

/**
 * Cambiar la contraseña del usuario autenticado
 * Permite al usuario cambiar su contraseña
 * Require su contraseña actual por seguridad
 * Put /api/auth/me/password
 */
const changePassword = async (req, res) => {
    try {
        const { passwordActual, passwordNueva } = req.body;

        // Validacion 1: Verificar que se proporcionan ambas contraseñas
        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({ 
                success: false,
                message: 'Se requiere password actual y nueva'
            });
        }

        // Validacion 2: Verificar que se proporcionan ambas contraseñas
        if (passwordNueva.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña actual debe tener al menos 6 caracteres'
            });
        }

        // Validacion 3: Buscar usuario con password incluido
        const usuario = await Usuario.scope('withPassword').findByPk(req.usuario.id);
        if (!usuario) {
            return res.status(400).json({
                success: false,
                message: 'Usuario no encontrado'
            })
        }

        // Validacion 4: Verificar que la contraseña actual es correcta
        const passwordValida = await usuario.compararPassword(passwordActual);
        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                message: 'Contraseña actual incorrecta'
            });
        }

        // Actualizar contraseña
        usuario.password = passwordNueva;
        await usuario.save();

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Contraseña actualizada correctamente'
        });

    } catch (error) {
        console.error('Error en changePassword: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar contraseña',
            error: error.message
        });
    }
};

//Exportar todos los controladores
module.exports = {
    registrar,
    login,
    getMe,
    updateMe,
    changePassword
};