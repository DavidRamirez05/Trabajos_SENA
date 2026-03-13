/**
 * MODELO USUARIO
 * 
 *Define la tabla Usuario en la base de datos 
 Almacena la informacion de los usuarios del sistema
 */

 //Importar DataTypes de sequelize
 const { DataTypes} = require('sequelize');

//Importar bcrypt para encriptar contraseñas
const bcrypt = require('bcrypt');

 //Importar instancia de sequelize
 const { sequelize } = require('../config/database');

 /**
  * Definir el modelo de Usuario
  */
 const Usuario = sequelize.define('Usuario', {
    //Campos de la tabla
    //Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El nombre del usuario no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        }
    },

    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: {
            msg: 'Este email ya esta registrado'
        },
        validate: {
            isEmail: {
                msg: 'El email debe tener un formato valido'
            },
            notEmpty: {
                msg: 'El email debe tener entre 2 y 100 caracteres'
            }
        }
    },

    password: {
        type: DataTypes.STRING(255), //Cadena larga para el hash
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La contraseña no puede estar vacia'
            },
            len: {
                args: [6, 255],
                msg: 'La contraseña debe tener entre 6 y 255 caracteres'
            }
        }
    },

    //Rol del usuario (cliente, auxiliar o administrador)
    rol: {
        type: DataTypes.ENUM('cliente', 'auxiliar', 'administrador'),
        allowNull: false,
        defaultValue: 'cliente', //Por defecto es cliente
        validate: {
            isIn: {
                args: [['cliente', 'auxiliar', 'administrador']],
                msg: 'El rol del usuario debe ser cliente, auxiliar o administrador'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        }
    },

    //Telefono del usuario 
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: true, //Es opcional
        is: {
            args: {
                args: /^\+?[0-9\s\-()]+$/, //Solo numeros, espacios, guiones y parentesis 
                msg: 'El telefono solo puede contener numeros y caracteres de formato valido'
            }
        }
    },
    
    //Direccion del usuario
    direccion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    /**
     * Activo estado del usuario
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true //Por defecto el usuario esta activo
    }
 }, {

    //Opciones del modelo
    tableName: 'usuarios',
    timestamps: true, // agrega campos de createdAt y updateAt

    /**
     * Scopes para consultas
     */
    defaultScope: {
        attributes: { exclude: ['password'] } 
    },
    scopes: {
        //Scope para incluir el campo password en las consultas necesarias (por ejemplo para login)
        withPassword: {
            attributes: {} //Incluir todos los atributos
        }
    },

    /**
     * Hooks funciones que se ejecutan automaticamente en ciertos eventos
     */
    hooks: { 
        /**beforeCreate: se ejecuta antes de crear un nuevo usuario
         * Encripta la contraseña antes de guardarla en la base de datos
        */
        beforeCreate: async (usuario) => {
            if (usuario.password) {
                //Generar un salt (Semilla aleatoria) con factor de costo 10
                const salt = await bcrypt.genSalt(10);
                //Encriptar la contraseña usando el salt generado
                usuario.password = await bcrypt.hash(usuario.password, salt);
            }
        },

    /**
     * beforeUpdate: se ejecuta antes de actualizar un usuario
     * Encripta la contraseña si fue modificada
     */
    beforeUpdate: async (usuario) => {
        //Verificar si la contraseña fue modificada
        if (usuario.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            usuario.password = await bcrypt.hash(usuario.password, salt);
        }
    }
}
});

 //METODOS DE INSTANCIA

 /**
  * Metodo para comparar contraseñas
  * Compara una contraseña en texto plano con el hash guardado
  * @param {string} passwordIngresado - Contraseña en texto plano a comparar
  * @returns {Promise<boolean>} - True si coinciden, false en caso contrario
  */

 
 Usuario.prototype.compararPassword = async function(passwordIngresado) {
    return await bcrypt.compare(passwordIngresado, this.password);
};

/** 
 * Metodo para obtener datos publicos del usuario (Sin contraseña)
 *  
 *  @returns {Object} - Objeto con los datos publicos del usuario
 */
 Usuario.prototype.toJSON = function() {
    const valores = Object.assign({}, this.get()); // Eleminar contraseña del objeto 
    delete valores.password; // Eliminar la contraseña del objeto devuelto
    return valores;
};

 //Exportar modelo Usuario
 module.exports = Usuario;