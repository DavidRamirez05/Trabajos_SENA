/*Configuracion de la base de datos */

//Importar sequelize
const { Sequelize } = require('sequelize');

//Importar dotenv para variables de entorno
require('dotenv').config();

//Crear instancias  de sacualize
const Sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',

        //Configurazion de pool de conexiones 
        //Mantieme ñas cpnexiones abieras para mejorar el rendimiento 
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000  
        },

            //Configuracion del logging
            //Permita ver la consulta de mysql por la consola 
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