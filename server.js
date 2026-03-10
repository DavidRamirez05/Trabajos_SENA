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
const { version } = require('os');
const { time } = require('console');

// Crear aplicacion express
const app = express();

// Obtener el puerto desde la variable de entorno
const PORT = process.env.PORT || 3000;

// MIDDLEWARES GLOBALES

// Cors para permitir peticiones desde el frontend
// Configurar que los dominios pueden hacer peticiones al backend
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', ///url del frontend
    credentials: true, // permitir enviar cookies 
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],  // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization']  // Encabezados permitidos
}));

/**
 * express.json() parsear el body de las peticiones en fomaro JSON
 */

app.use(express.json());

/**
 * express.urlencoded() - parse el body de los formularios
 * las imagenes estaran disponibles
 */

app.use(express.urlencoded({extended: true}));

/**
 * servir archivos estaticos iamgenes desdde la capeta raiz
 */

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Midleware para logging de las peticiones
// Muestra en consola cada peticion que llega el servidor

if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`ok ${req.method} ${req.path}`);
        next();
    });
}

// RUTAS

// Rutas raiz verificar el servidor esta corriendo
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Servidor E-commerce Backend corriendo correctamente',
        version: '1.0.0',
        time: new Date().toISOString()
    });
});

// Rutas de salud  para verificar que el servidor como esta
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'healthy',
        version: 'connected',
        time: new Date().toISOString()
    });
});

//Rutas api

// Rutas de autenticacion
// Incluye registro login, perfil

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);