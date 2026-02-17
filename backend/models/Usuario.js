/**
 * MODELO USUARIO
 * 
 *Define la tabla Usuario en la base de datos 
 Almacena la informacion de los usuarios del sistema
 */

 //Importar DataTypes de sequelize
 const { DataTypes} = require('sequelize');

//Importar DataTypes de sequelize
const { DataTypes} = require('bcrypt');

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
                msg: 'El telefono solo puede contener numeros, espacios, guiones y parentesis'
            }
        }
    },
    

    /**
     * Descripcion de la categoria
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    /**
     * Activo estado de la categoria
     * si es false la categoria y todas sus subcategorias y productos se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }
 }, {
    //Opciones del modelo 

    tableName: 'categorias',
    timestamps: true, // agrega campos de createdAt y updateAt

    /**
     * Hooks acciones automaticas
     */

    hooks: {
        /**
         * afterUpdate: se ejecuta despues de actualizar una categoria
         * si se desactiva una categoria se desactivan todas sus subcategorias y productos
         */
        afterUpdate: async (categoria, options) => {
            //Verificar si el campo activo cambio
            if (categoria.changed('activo') && !categoria.activo) {
                console.log(`Desactivando categoria: ${categoria.nombre}`);

                //Importar modelos (Aqui para evotar dependencias circulares)
                const subcategoria = require('./Subcategoria');
                const Producto = require('./Producto');

                try{ 
                    //Paso 1 desactivar las subcategorias de esta categoria
                    const subcategorias = await subcategorias.findAll({ 
                        where: { categoriaId: categoria.id}
                    });

                    for (const subcategoria of subcategorias) {
                        await subcategoria.update({ activo:false }, { transaction:options.transaction });
                        console.log(`Subcategoria desactivada: ${subcategoria.nombre}`);
                    }

                    //Paso 2 desactivar los productos de estacategoria
                    const productos = await Producto.findAll({ 
                        where: { categoriaId: categoria.id}
                    });

                    for (const producto of productos) {
                        await producto.update({ activo:false }, { transaction:options.transaction });
                        console.log(`Producto desactivada: ${producto.nombre}`);
                    }

                    console.log(`Categorias y elementos reacionados desactivados correctamente`);
                } catch (error) {
                    console.error('Error al desactivar elementos relacionados:', error.message);
                    throw error;
                }
            }
            //Si se activa una categoria no se activan automaticamente las subcategorias y productos
        }
    }
 });

 //METODOS DE INSTANCIA
 /**
  * Metodo para contar subcategorias de esta categoria
  * 
  * @returns {Promise<number} - Numero de sbcategorias
  */
 Categoria.protoype.contarSubcategorias = async function(){
    const Subcategoria = requiere('./Subcategoria');
    return await Subcategoria.count({ where: {categoriaId: this.id}});
};

/** 
 * Metodo para contar productos de esta categoria
 *  
 *  @returns {Promise<number} - Numero de sbcategorias
 */
 Categoria.protoype.contarProductos = async function(){
    const Producto = requiere('./Producto');
    return await Producto.count({ where: {categoriaId: this.id}});
};

 //Exportar modelo Categoria
 module.exports = Categoria;