/**
 * Rutas de autenticacion
 * Define las endpoints para registro login y gestion de perfil de usuario
 */

// Importar Router de express
const express = require('express');
const router = express.Router();

// Importar controladores de autenticacion
const {
    register, 
    login,
    getMe,
    updateMe,
    changePassword,
} = require('../controllers/auth.controller');