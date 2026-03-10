/**
 * SERVIDOR PRINCIPAL DE BACKEND
 * Este es el archivo principal del servidor del backend
 * Configura express. Middlewares, rutas y conexion a la base de datos
 */

// IMPORTACIONES 

// Importar express para crear el servidor
const express = require('express');

// Importar cors para permitir solicitudes desde el frontend
const cors = require('cors');

// Importar path para manejar rutas de archivos
const path = require('path');

// Importar dotenv para manejar variables de entorno
require('dotenv').config();

// Importar configuracion de la base de datos
const { conectarDB } = require('./config/database');

// Importar modelos y asociaciones
const { initAssociations } = require('./models');

//Importar seeders
const { runSeeders } = require('./seeders/adminSeeder');

// Crear aplicacion express
const app = express();

// Obtener el puerto desde la variable de entorno
const PORT = process.env.PORT || 3000;

// MIDDLEWARES GLOBALES

// Cors para permitir peticiones desde el frontend
// Configurar que los dominios pueden hacer peticiones al backend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Permitir solo el dominio del frontend
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'] // Encabezados permitidos
}));