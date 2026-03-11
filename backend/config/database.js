/*Configuracion de la base de datos */

//Importar sequelize
const { Sequelize } = require('sequelize');
    
//Importar dotenv para variables de entorno
require('dotenv').config();

//Crear instancias de sequelize
const sequelize = new Sequelize(
    //Cuando aparece esto es de las variables de entorno:
    process.env.DB_NAME, 
    process.env.DB_USER, 
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',

        //Configuracion de pool de conexiones 
        //Mantiene las conexiones abiertas para mejorar el rendimiento 
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000  
        },

        //Configuracion del logging
        //Permite ver las consultas de MYSQL por la consola 
        logging: process.env.NODE_ENV === 'development' ? console.log : false,

            
        //Zona horaria
        timezone: '-05:00', //Zona horaria de Colombia

        //Opciones adicionales
        define: {
            //timestamps: true crea automaticamente los campos createdAt y updatedAt
            timestramps: true,

            //Underscored: true una snake_case para nombres de las columnas
            underscored: false,

            //flazeTableName: true usa el nombre del modelo tal cual para la tabla
            freezeTableName: true
        }
    }
);

/** Funcion para probar la conexion de la base de datos
 * esta funcion se llamara al inicial el servidor
 */
const testConnection = async () => {
    try {
        //Intentar autenticar con la base de datos
        await sequelize.authenticate();
        console.log('Conexion a MySql establecida correctamente');
        return true;

    } catch (error) {
        console.error('Error al conectar a MySQL:', error.message);
        console.error('Verifica que XAMPP este corrigiendo y las credenciales en .env sean correctas');
    return false;
    }
}

/*
 * Funcion para sincronizar los modelos con la base de datos
 * Esta funcion crearan las tablas automaticamente basandose en los modelos 
 * @param {bolean} force - si es true, elemina y recrea todas las combineTableName
 * @param {bolean} alter - si es true, modifica las tablas existentes para que coincidan con los modelos
*/

const syncDatabase = async (force = false, alter = false) => {
    try{
        // Sincronizar todos los modelos con la base de datos
        await sequelize.sync({force, alter});

        if (force) {
            console.log("Base de datos sincronizada: (todas las tablas recreadas).");
        } else if (alter) {
        console.log("Base de datos sincronizada (tablas alteradas segun los modelos).");
        } else {
        console.log("Base de datos sincronizada correctamente.");
    }

        return true;
    } catch (error) {
        console.error('X Error al sincronizar la base de datos:', error.message);
        return false;
    }
};
// Exportar la instancia de sequelize y las funciones
module.exports = {
    sequelize,
    testConnection,
    syncDatabase
};