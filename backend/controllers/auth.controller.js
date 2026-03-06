/**
 * Controller de autenticacion
 * Maneja elregistro,login y obtencion del perfil del usuario
 */

/**
 * Importar modelos
 */

const Usuario = require('../models/Usuario');
const { generarToken } = require('../config/jwt');

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
            const token = generarToken({
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
                console.error('Error en registrar: ', error);{
                    return res.status(400).json({
                        success: false,
                        message: 'Error al registrar usuario',
                        errors: error.errors.map(e => e.message)
                    });
                }
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
        const token = generarToken({
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
            }
        })

/**
 * Obtener perfil del usuario autenticado
 * Requiere middleware verificarAuth 
 * GET /api/auth/profile
 * headers: { Authorization: 'Bearer TOKEN' }
 */
const getMe = async (req, res) => {
    try {
        // El usuario ya esta en req.usuario
        const usuario = await Usuario.findByPk(req.usuario.id);
        
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
        if (rol !== undefined) usuario.rol = rol;

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
        console.error('Error en actualizarUsuario: ', error);
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: error.message
        });
    } 
};

/**
 * Activar/Desactivar Usuario
 * PATCH /api/admin/usuarios/:id/estado
 * 
 * Al desactivar un usuario
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const toggleUsuario = async (req, res) => {
    try {
        const {id} = req.params;

        //Buscar usuario
        const usuario = await Usuario.findByPk(id);

        if(!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        //No permitir desactivar un administrador si es él mismo
        if (usuario.id === req.usuario.id) {
            return res.status(400).json({
                success: false,
                message: 'No se puede desactivar tu propia cuenta'
            });
        }

        usuario.activo = !usuario.activo;
        await usuario.save();

        res.json({
            success: true,
            message: `Usuario ${usuario.activo ? 'activado' : 'desactivado'} exitosamente`,
            data: {
                usuario: usuario.toJSON()
            }
        });

    } catch (error) {
        console.error('Error en toggleUsuario: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado del usuario',
            error: error.message
        });
    }
};

/**
 * Eliminar Usuario
 * DELETE /api/admin/usuarios/:id
 * Solo permite eliminar si no tiene subcategorias ni productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar usuario
        const usuario = await Usuario.findByPk(id);

        if (!usuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            }); 
        }

        //No permitir eliminar un administrador si es él mismo
        if (usuario.id === req.usuario.id) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar tu propia cuenta'
            });
        }
        await usuario.destroy();

        //Respuesta Exitosa
        res.json({
            success: true,
            message: 'Usuario eliminado Exitosamente'
        });

    }  catch (error) {
        console.error('Error al eliminar usuario', error);
        res.status(400).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error.message
        });
    }
};

/**
 * Obtener estadisticas de usuarios
 * GET /api/admin/usuarios/:id/estadisticas
 * 
 * @param {Object} req request Express|}
 * @param {Object} res response Express
 */
const getEstadisticasUsuarios = async (req, res) => {
    try {
        //Datos de usuarios
        const totalUsuarios = await Usuario.count();
        const totalClientes = await Usuario.count({ where: { rol: 'cliente' } });
        const totalAdmins = await Usuario.count({ where: { rol: 'admin' } });
        const usuariosActivos = await Usuario.count({ where: { activo: true } });
        const usuariosInactivos = await Usuario.count({ where: { activo: false } });

        //Respuesta exitosa
        res.json({
            success: true,
            data: {
                total: totalUsuarios,
                porRol: {
                    cliente: totalClientes,
                    admininistradores: totalAdmins
                },
                porEstado: {
                    activos: usuariosActivos,
                    inactivos: usuariosInactivos,
                },
            }
        });
    } catch (error) {
        console.error('Error en getEstadisticasUsuarios: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas de usuarios',
            error: error.message
        });
    }
};

//Exportar todos los controladores
module.exports = {
    getUsuarios,
    getUsuarioById,
    crearUsuario,
    actualizarUsuario,
    toggleUsuario,
    eliminarUsuario,
    getEstadisticasUsuarios
};