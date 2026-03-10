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

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// Rutas de administrador
// Requieren autenticacion y rol de administrador
const adminRoutes = require('./routes/admin.routes');
app.use('/api/admin', adminRoutes);

// Rutas de cliente
const clienteRoutes = require('./routes/cliente.routes');
app.use('/api/cliente', clienteRoutes);

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada',
        path: req.path,
    });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    // Manejo de errores globales
    
    app.use((err, req, res, next) => {
        console.error('Error:', err.message);
        // Error de multer subida de archivos
        if(err.name === 'MulterError') {
            return res.status(400).json({
                success: false,
                message: 'Error al subir el archivo',
                error: err.message
            });
        }
    });

    // Otros errores
    res.status(500).json({
        success: false,
        message: err.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Inicializar el servidor y base de datos

/**
 * Funcion principal para iniciar el servidor 
 * Prueba la conexion a MySQL
 * Sincroniza los modelos (Crea las tablas)
 * Inicia el servidor express 
 */
const startServer = async () => {
    try {
        // Paso 1: Probar conexion a MySQL
        console.log(' Conectado a MySQL...');
        const dbConnected = await dbConfig.testConnection();

        if(!dbConnected) {
            console.error('No se pudo conectar a la base de datos. Verifica tu configuración.');
            process.exit(1); // Salir si no hay conexion
        }

        // Paso 2: Sincronizar modelos (Crear tablas)
        console.log('Sincronizando modelos con la base de datos...');

        //Inicializar asociaciones entre modelos
        initAssociations();

        // En desarrollo alter puede ser true para actualizar la estructura
        // En produccion debe ser false para no perder datos
        const alterTables = process.env.NODE_ENV === 'development';
        const dbSynced = await synDatabase(false, alterTables);

        if (!dbSynced) {
            console.error('X Error al sincronizar la base de datos');
            process.exit(1);
        }

        // Paso 3: Ejecutar seeders datos iniciales
        await runSeeders();

        // Paso 4: Iniciar servidor express
        app.listen(PORT, () => {
            console.log(`\n ____________________`);
            console.log(`Servidor corriendo en el puerto ${PORT}`);
            console.log(`URL: http://localhost:${PORT}`);
            console.log(`Base de datos ${process.env.DB_NAME}`);
            console.log(`Modo: ${process.env.NODE_ENV}`);
            console.log(`Servidor listo para realizar peticiones...`);
        });
    } catch (error) {
        console.error('X Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
};

// Manejo de cierre
// Captura el ctrl+c para cerrar el servidor correctamente

process.on('SIGINT', () => {
    console.log('\nServidor cerrado por el usuario');
    process.exit(0);
});