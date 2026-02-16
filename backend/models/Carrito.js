/**
 * MODELO CARRITO
 * 
 *Define la tabla Carrito en la base de datos 
 Almacena los productos que el usuario ha agregado al carrito de compras
 */

 //Importar DataTypes de sequelize
 const { DataTypes} = require('sequelize');

 //Importar instancia de sequelize
 const { sequelize } = require('../config/database');

 /**
  * Definir el modelo del carrito
  */
 const Carrito = sequelize.define('Carrito', {
    //Campos de la tabla
    //Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    //UsuarioId ID del usuario al que pertenece el carrito (FOREIGN KEY)
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', //Si el usuario se elimina, se elimina su carrito
        validate: {
            notNull: {
                msg: 'Debe especificar un usuario'
            }
        }
    },

    //UsuarioId ID del producto en el carrito
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Productos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', //Si el producto se elimina, se elimina su registro en el carrito
        validate: {
            notNull: {
                msg: 'Debe especificar un producto'
            }
        }
    },

    //Cantidad del producto en el carrito
    cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            isInt: {
                msg: 'La cantidad debe ser un número entero'
            },
            min: {
                args: [1],
                msg: 'La cantidad debe ser mayor o igual a 1'
            }
        }
    },

    /**
     * Precio Unitario del producto al momento de agregarlo al carrito
     * Se guarda para mantener el precio aunque un producto cambie de precio
     */

    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        unique: {
            msg: 'El precio debe ser un numero decimal valido'
        },
        min: {
            args: [0],
            msg: 'El precio no puede ser negativo'
        }
    }
}, {
    //Opciones del modelo
    tableName: 'carritos',
    timestamps: true, //Indices para mejorar las busquedas
    //Indices para mejorar las busquedas
    indexes: [
        {
            //Indice para buscar carrito por usuario
            fields: ['usuarioId']
        },
        {
            //Indice para buscar carrito por producto
            fields: ['productoId']
        }
        
        //Indice compuesto: Un usuario no puede tener el mismo producto mas de una vez en el carrito
        {
            unique: true,
            fields: ['usuarioId', 'productoId'],
            name: 'usuario_producto_unique'
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
 Subcategoria.protoype.contarproductos = async function(){
    const Producto = requiere('./Producto');
    return await Producto.count({ where: {subcategoriaId: this.id}});
};