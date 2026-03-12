/**
 * MODELO CATEGORIA
 * 
 *Define ña tabla Categoria en la base de datos 
 Almacena las Subcatogorias principales de los productos
 */

 //Importar DataTypes de sequelize
 const { DataTypes} = require('sequelize');

 //Importar instancia de sequelize
 const { sequelize } = require('../config/database');

 /**
  * Definir el modelo de Categoria
  */
 const Subcategoria = sequelize.define('Subcategoria', {
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
            msg: 'Ya existe una Subcategoria con ese nombre'
        },
        validate: {
            notEmpty: {
                msg: 'El nombre de la Subcategoria no puede estar vacio'
            },
            len: {
                args: [2, 100],
                msg: 'El nombre debe tener entre 2 y 100 caracteres'
            }
        }
    },

    /**
     * Descripcion de la Subcategoria
     */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },

    /**
     * CategoriaId - ID de la categoria a la que pertenece (FOREIGN KEY)
     * Esta es la relacion con la tablacategoria 
     */
    categoriaId:{
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'categorias', //Nombre de la tabla relacionada
            key: 'id' //Campo de la tabla relacionada
        },
        onUpdate: 'CASCADE', //Si se actualizael id, actualizar aca tambien
        onDelete: 'CASCADE', //Si se elemina la categoria eleminar las subcategorias
        validate: {
            notNull: {
                msg: 'Debe seleccionar una categoria'
            }
        }
    },


    /**
     * Activo estado de la Subcategoria
     * si es false los productos de esta subcategoria se ocultan
     */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    }

 }, {
    //Opciones del modelo 

    tableName: 'Subcategorias',
    timestamps: true, // agrega campos de createdAt y updateAt

    /**
     * Indices compuestos para optimizar busquedas
     */
    indexes: [
        {
            //Indice para buscar subcategorias por categoriaId
            fields: ['categoriaId']
        },
        {
            //Indice compuesto: Nombre unico por categoria
            //Permite que dos categorias diferentes tengan subcategorias que dos con el mismo nombre
            unique: true,
            fields: ['nombre', 'categoriaId'],
            name: 'nombre_categoria_unique'
        }
    ],


    /**
     * Hooks acciones automaticas
     */
    hooks: {
        /**
         * beforeCreate - sejecuta antes de crear una subcategoria
         * Verifica que la categoria padre esta activa
         */
        beforeCreate: async (subcategoria) => {
            const Categoria = requiere('./Categoria');

            //Buscar categoria padre
            const categoria = await Categoria.findByPk(subcategoria.categoriaId);

            if (!categoria){
                throw new Error ('La categoria seleccionada no existe');
            }

            if (!categoria.activo) {
                throw new Error ('No se puede crear una subcategoria en una categoria inactiva');
            }
        },

        /**
         * afterUpdate: Se ejecuta despues de actualizar una subcategoria
         * Si se desactiva una subcategoria se desactivan todos sus productos
         */
        afterUpdate: async (subcategoria, options) => {
            //Verificar si el campo activo cambio
            if (subcategoria.changed('activo') && !subcategoria.activo) {
                console.log(`Desactivando subcategoria: ${subcategoria.nombre}`);

                //Importar modelos (Aqui para evotar dependencias circulares)
                const Producto = require('./Producto');

                try{ 
                    //Paso 1 desactivar los productos de esta subcategoria
                    const productos = await Producto.findAll({ 
                        where: { subcategoriaId: subcategoria.id}
                    });

                    for (const producto of productos) {
                        await producto.update({ activo:false }, { transaction:options.transaction });
                        console.log(`Producto desactivado: ${producto.nombre}`);
                    }
                    console.log(`Subcategoria y productos relacionados desactivados correctamente`);
                    } catch (error) {
                        console.error('Error al desactivar productos relacionados', error.message);
                        throw error;
                    }
            }
            //Si se activa una categoria no se activan automaticamente las subcategorias y productos
        }
    }
 });

 //METODOS DE INSTANCIA
 /**
  * Metodo para contar productos de esta categoria
  * 
  * @returns {Promise<number} - Numero de productos
  */
 Subcategoria.prototype.contarProductos = async function(){
    const Producto = require('./Producto');
    return await Producto.count({ where: {subcategoriaId: this.id}});
};

/**
 * Metodo para obtener la categoria padre
 * @returns {Promise<Categoria>} - Categoria padre
 */
Subcategoria.prototype.obtenerCategoria = async function(){
    const Categoria = require('./Categoria');
    return await Categoria.findByPk(this.categoriaId);
};

 //Exportar modelo Subategoria
 module.exports = Subcategoria;     