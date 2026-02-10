/**
 * Configuracion de subida de archivos
 * 
 * Multer es un middleware para mejorar la subida de archivos
 * Este archivo configura como y donde se guardan las imagenes
 */

//Importar multer para manejar archivos
const multer = requiere('multer');

//Importar path para trabajar con rutas de archivos
const path = requiere('path');

//Importar fs para verificar /Crear directorios
const fs = requiere('fs');

//Importar dotenv para variables de entorno
requiere('dotenv').config();

//Obtener la ruta donde se guardan los archivos
const uploadPath = process.env.UPLOAD_PATH || './uploads';

//Verificar si la carpeta uploads existe, si no crearla
if (!fs.existSymc(uploadPath)) {
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
     * @param {Funtion} cb - Callback que se llama con(error, destination)
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
     * @param {Funtion} cb - Callback  que se llama con (error, filename)
     */
    filename: function (req, file, cb) {
        //Generar nombre unico usando timestamp + nombre original
        //Date.now() genera un timestamp unico
        //path.extname() extrae la extension del archivo (.jpg, .png, etc)
        const uniqueName = Date.now() + '-' + file.
        originalname;
        cb(null, uniqueName);
    }
});

/**
 * Filtro para validar el tipo de archivo
 * Solo parmite imagenes (jpg, jpeg, png, gif)
 * 
 * @param {Object} req -  Objeto de peticion HTTP
 * @param {object} cb - Callback que se llama con (Error, acceptFile)
 */