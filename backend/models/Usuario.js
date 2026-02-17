/**
 * MODELO CATEGORIA
 * 
 *Define la tabla Categoria en la base de datos 
 Almacena las cetogorias principales de los productos
 */

 //Importar DataTypes de sequelize
 const { DataTypes} = require('sequelize');

 //Importar instancia de sequelize
 const { sequelize } = require('../config/database');

 /**
  * Definir el modelo de Categoria
  */
 const Categoria = sequelize.define('Categoria', {
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
        unique: {
            msg: 'Ya existe una categoria con ese nombre'
        },
        validate: {
            notEmpty: {
                msg: 'El nombre de la categoria no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
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