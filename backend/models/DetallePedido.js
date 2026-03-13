/**
 * MODELO DETALLE PEDIDO
 * 
 * Define la tabla Detalle Pedido en la base de datos 
 * Almacena los productos incluidos en cada pedido
 * Relacion muchos a muchos con Pedido y Producto
*/

//Importar DataTypes de sequelize
const { DataTypes } = require('sequelize');

//Importar instancia de sequelize
const { sequelize } = require('../config/database');

/**
 * Definir el modelo del detalle pedido
 */
const DetallePedido = sequelize.define('DetallePedido', {
    // Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    // UsuarioId ID del usuario al que pertenece el carrito (FOREIGN KEY)
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        validate: {
            notNull: {
                msg: 'Debe especificar un usuario'
            }
        }
    },

    // PedidoId ID del pedido al que pertenece el detalle
    pedidoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pedidos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        validate: {
            notNull: {
                msg: 'Debe especificar un pedido'
            }
        }
    },

    // ProductoId ID del producto en el detalle del pedido
    productoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'productos',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        validate: {
            notNull: {
                msg: 'Debe especificar un producto'
            }
        }
    },

    // Cantidad del producto en el carrito
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
     * Precio Unitario del producto al momento del pedido
     * Se guarda para mantener el historial aunque el producto cambie de precio
     */
    precioUnitario: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El precio unitario debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: 'El precio unitario no puede ser negativo'
            }
        }
    },

    /**
     * Subtotal del item en el pedido (precio unitario * cantidad)
     * Se calcula automaticamente antes de guardar el detalle del pedido
     */
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg: 'El subtotal debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg: 'El subtotal no puede ser negativo'
            }
        }
    }

}, {
    // ✅ Las opciones van aquí, como segundo argumento de sequelize.define
    tableName: 'detalle_pedido',
    timestamps: false,

    indexes: [
        {
            fields: ['pedidoId']
        },
        {
            fields: ['productoId']
        }
    ],

    hooks: {
        /**
         * beforeCreate - Calcula el subtotal automaticamente
         */
        beforeCreate: async (detalle) => {
            detalle.subtotal = parseFloat(detalle.precioUnitario) * detalle.cantidad;
        },

        /**
         * beforeUpdate - Recalcula el subtotal si cambio precio o cantidad
         */
        beforeUpdate: (detalle) => {
            if (detalle.changed('precioUnitario') || detalle.changed('cantidad')) {
                detalle.subtotal = parseFloat(detalle.precioUnitario) * detalle.cantidad;
            }
        }
    }
});

// METODOS DE INSTANCIA

/**
 * Metodo para calcular el subtotal
 * @returns {number} - Subtotal calculado (precio unitario * cantidad)
 */
DetallePedido.prototype.calcularSubtotal = function () {
    return parseFloat(this.precioUnitario) * this.cantidad;
};

/**
 * Metodo para crear detalles del pedido desde el carrito
 * @param {number} pedidoId - ID del pedido
 * @param {Array} itemsCarrito - Items del carrito a convertir
 * @returns {Promise<Array>} - Detalles de pedido creados
 */
DetallePedido.crearDesdeCarrito = async function (pedidoId, itemsCarrito) {
    const detalles = [];

    for (const item of itemsCarrito) {
        const detalle = await this.create({
            pedidoId: pedidoId,
            productoId: item.productoId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario  // ✅ corregido: era "item," y "precioUnitario" separados
        });
        detalles.push(detalle);
    }
    return detalles;
};

/**
 * Metodo para calcular el total de un pedido desde sus detalles
 * @param {number} pedidoId - ID del pedido
 * @returns {Promise<number>} - Total del pedido
 */
DetallePedido.calcularTotalPedido = async function (pedidoId) {
    const detalles = await this.findAll({
        where: { pedidoId }
    });

    let total = 0;
    for (const detalle of detalles) {
        total += parseFloat(detalle.subtotal);
    }
    return total;
};

/**
 * Metodo para obtener resumen de productos mas vendidos
 * @param {number} limite numero de productos a retornar
 * @returns {Promise<Array>} Productos mas vendidos
 */
DetallePedido.obtenerMasVendidos = async function (limite = 10) {
    // ✅ corregido: era "saquelize" (typo), y ya tenemos sequelize importado arriba
    return await this.findAll({
        attributes: [
            'productoId',
            [sequelize.fn('SUM', sequelize.col('cantidad')), 'totalVendido']
        ],
        group: ['productoId'],
        order: [[sequelize.fn('SUM', sequelize.col('cantidad')), 'DESC']],
        limit: limite
    });
};

// Exportar modelo
module.exports = DetallePedido;