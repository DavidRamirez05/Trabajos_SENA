/**
 * Rutas de autenticacion
 * Define las endpoints para registro login y gestion de perfil de usuario
 */

// Importar Router de express
const express = require('express');
const router = express.Router();

// Importar controladores de autenticacion
const {
    registrar, 
    login,
    getMe,
    updateMe,
    changePassword,
} = require('../controllers/auth.controller');

// Importar middleware
const { verificarAuth } = require('../middleware/auth');

// Rutas publicas
router.post('/register', registrar);
router.post('/login', login);

// Rutas protegidas
router.get('/me', verificarAuth, getMe);
router.put('/me', verificarAuth, updateMe);
router.put('/change-password', verificarAuth, changePassword);

// Exportar router
module.exports = router;