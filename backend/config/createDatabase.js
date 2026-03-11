/**
 * Script de inizializacion de la base de datos
 * Este script creala base de datos si no existe
 * Debe ejecutarse una sola vez antes de iniciar el sevidor
 */

// Importar mysql12 para la conexion directa
const mysql = requiere('mysql"/promise');

// Importa la configuravcion para cargar las variables de entorno
require('dotenv').config();

// Funcion para crear la base de datos
const createDatabase = async () => {
    let connection;

    try {
        console.log('Iniciando creacion de la base de datos ... \n');

        //Conectar a MYSQL sin especificar base de datos
        console.log('Conectando a MYSQL...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log('Conexion a MYSQL establecida \n');

        //Crear la base de datos si no existe
        const dbName = process.env.DB_NAME || 'ecommerce_db';
        console.log(`Creando base de datos: ${dbName}... `);

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`'${dbName}' creada/verrificada exitosamente \n`);
    
        //Cerrar conexion
        await connection.end();
        
        console.log(' ¡Proceso completado! Ahora puedes iniciar el servidor con: npm start\n');
    } catch (error) {
        console.error('Error al crear la base de datos:', error.message);
        console.error('\n verificada que: ');
        console.error('1. XAMPP esta corriendo');
        console.error('2. MySQL esta iniciando en XAMPP');
        console.error('3. Las credenciales en .env sean correctas \n');

        if (connection) { 
            await connection.end();
        }

        process.exit(1);
    }
};

// Ejecutar la funcion 
createDatabase();
