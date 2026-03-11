/**
 * Configuracion de subida de archivos
 * 
 * Multer es un middleware para mejorar la subida de archivos
 * Este archivo configura como y donde se guardan las imagenes
 */

//Importar multer para manejar archivos
const multer = require('multer');

//Importar path para trabajar con rutas de archivos
const path = require('path');

//Importar fs para verificar /Crear directorios
const fs = require('fs'); //File System Utilizado para crear carpeta y archivos

//Importar dotenv para variables de entorno
require('dotenv').config();

//Obtener la ruta donde se guardan los archivos
const uploadPath = process.env.UPLOAD_PATH || './uploads'; 

//Verificar si la carpeta uploads existe, si no existe la crea automaticamentes
if (!fs.existsSync(uploadPath)) { 
    fs.mkdirSync(uploadPath, { recursive: true });
    console.log(`Carpeta ${uploadPath} creada`);
}

/**
 * Configuracion de almacenamiento multer  
 * Define donde y como se guardan los archivos
 */

const storage = multer.diskStrorage({
    /**
     * Destination: Define la carpeta destino donde se guardan el archivo
     * 
     * @param {object} req - Objeto de peticion HTTP
     * @param {Object} file - Archivo que esta subiendo
     * @param {Function} cb - Callback que se llama con(error, destination)
     */
    destination: function (req, file, cb){
        //cb(null,ruta) -> Sin error, ruta = carpeta destino
        cb(null,uploadPath);
    },

    /**
     * Filename: Define el nombre con el que se guardara el archivo
     * Formato: Timestamp-nombreoriginal.ext
     * 
     * @param {object} req - Objeto de peticion HTTP
     * @param {object} file -archivo que se esta subiendo
     * @param {Function} cb - Callback  que se llama con (error, filename)
     */
    filename: function (req, file, cb) {
        //Generar nombre unico usando timestamp + nombre original
        //Date.now() genera un timestamp unico
        //path.extname() extrae la extension del archivo (.jpg, .png, etc)
        const uniqueName = Date.now() + '-' + file.originalname; //Nombre del archivo original
        cb(null, uniqueName); // Luegigo se guarda con el nombre 
    }
});

/**
 * Filtro para validar el tipo de archivo
 * Solo parmite imagenes (jpg, jpeg, png, gif)
 * 
 * @param {Object} req -  Objeto de peticion HTTP
 * @param {object} cb - Callback que se llama con (Error, acceptFile)
 */

const filefilter = (req, file, cb) => {
    //Tipo Mime permitidos para imagenes
    const allowedMimeTypes = ['image/jpeg', 'image jpg', 'image/png', 'image/gif']; //Aqui es donde se importan los tipos de archivos permitidos, en este caso imagenes

    //Verificar si el tipo de archivo esta en la lista permitida

    if( allowedMimeTypes.includes(file.mine)) {
        //cb (null, true) -> Aceptar el archivo
        cb(null,true);
    } else {
        //cb (error) -> Rechazar archivo
        cb(new Error('Solo se permite imagenes (JPG, JPEG, PNG, GIF)'), false); //Para indicar que el archivo no es aceptado
    }
};

/**
 * Configurar multer con las opciones definidas
 */

const upload = multer ({
    storage: storage,
    filefilter: filefilter, 
    limits: {
        //Limite de tamaño de archivo en bytes
        //Por defecto 5MB (5 * 1024) 5242880 bytes
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880
    }
});

/**
 * Funcion para eleminar el archivo del servidor
 * Util cuando se actualiza o elemina el producto
 * 
 * @param {String} filename - nombre del archivo a eleminar
 * @returns {Boolean} - True si se elemino, false si hubo un error 
 */

const deletefile = (filename) => {
    try{ 
        //Construir la ruta completadel archivo
        const filePath = path.join(uploadPath, filename);

        //Verificar si el archivo existe 
        if (fs.existsSync(filePath)) {
            //Eleminar el archivo
            fs.unlinkSync(filePath);
            console.log(`Archivo eleminado: ${filename}`);
            return true;
        } else {
            console.log(`Archivo no encontrado: ${filename}`);
            return false;
        }
    } catch (error){
        console.error('Error al eleminar archivo:', error.message);
        return false;
    }
};

//Exportar configuracion de multer y funcion de eleminacion
module.exports = {
    upload,
    deletefile
};