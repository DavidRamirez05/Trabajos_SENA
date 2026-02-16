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
},  {
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
        },
        
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
         * beforeCreate - Se ejecuta antes de crear un nuevo carrito
         * Verifica que esta activo y tenga stock suficiente
         */
        beforeCreate: async (itemCarrito) => {
            const Producto = requiere('./Producto');

            //Buscar producto
            const producto = await Producto.findByPk(itemCarrito.productoId);

            if (!producto){
                throw new Error ('El producto no existe');
            }

            if (!producto.activo) {
                throw new Error ('No se puede agregar al carrito un producto inactivo');
            }

            if (!producto.hayStock(itemCarrito.cantidad)) {
                throw new Error (`Stock insuficiente. Solo quedan ${producto.stock} unidades disponibles`);
            }

            //Guardar el precio actual del producto en el carrito
            itemCarrito.precioUnitario = producto.precio;
        },

        /**
         * BeforeUpdate: Se ejecuta antes de actualizar un carrito
         * Valida que haya stock suficiente si se aumenta la cantidad
         */
        BeforeUpdate: async (itemCarrito) => {

            if (itemCarrito.changed('cantidad')) {
                const Produco = requiere('./Producto');
                const producto = await Producto.findByPk(itemCarrito.productoId);

                if (!producto) {
                    throw new Error ('El producto no existe');
                }

                if (!producto.hayStock(itemCarrito.cantidad)) {
                    throw new Error (`Stock insuficiente. Solo quedan ${producto.stock} unidades disponibles`);
                }
            }
        }
    }
 });

 //METODOS DE INSTANCIA
 /**
  * Metodo para calcular el subtotal de un item del carrito  
  * @returns {number} - (precio unitario * cantidad)
  */
 Carrito.prototype.calcularSubtotal = function(){
    return parseFloat(this.precioUnitario) * this.cantidad;
 };

 /**
  * Metodo para actualizar la cantidad de un item del carrito
  * @param {number} nuevaCantidad - Mueva cantidad
  * @returns {Promise} - Item actualizado
  */
    Carrito.prototype.actualizarCantidad = async function(nuevaCantidad) {
        const Producto = requiere('./Producto');

        const producto = await Producto.findByPk(this.productoId);
        
        if (!producto.hayStock(nuevaCantidad)) {
            throw new Error(`Stock insuficiente. Solo quedan ${producto.stock} unidades disponibles`);
        }
        this.cantidad = nuevaCantidad;
        return await this.save();
    };

 /**
  * Metodo para obtener el carrito completo de un usuario
  * Incluye unformacion de los productos
  * @param {number} usuarioId - ID del usuario
  * @returns {Promise<Array>} - Items del carrito con informacion del producto
  */
 Carrito.obtenerCarritoCompleto = async function(usuarioId) {
    const Producto = requiere('./Producto');

    const itemsCarrito = await Carrito.findAll({
        where: { usuarioId },
        include: [
            {
                model: Producto,
                as: ['producto']
            }
        ],
        order: [['createdAt', 'DESC']]
    });
};

/**
 * Metodo para calcular el total del carrito de un usuario
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<number>} - Total del carrito
 */
Carrito.calcularTotalCarrito = async function(usuarioId) {
    const itemsCarrito = await Carrito.findAll({
        where: { usuarioId }
    });

    let total = 0;
    for (const item of itemsCarrito) {
        total += item.calcularSubtotal();
    }
    return total;
};

/**
 * Metodo para vaciar el carrito de un usuario
 * Util despues de realizar un pedido
 * @param {number} usuarioId - ID del usuario
 * @returns {Promise<number>} - Numero de items eleminados
 */
Carrito.vaciarCarrito = async function(usuarioId) {
    return await Carrito.destroy({
        where: { usuarioId }
    });
};

//Exportar modelo
module.exports = Carrito;