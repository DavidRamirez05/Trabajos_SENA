try {
    const usuarioController = require('./controllers/usuario.controller');
    console.log('Methods:', Object.keys(usuarioController));
    console.log('getUsuarioById:', typeof usuarioController.getUsuarioById);
} catch (e) {
    console.error('Error:', e.message);
}