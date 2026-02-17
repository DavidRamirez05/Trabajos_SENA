/**
 * MODELO PEDIDO
 * 
 *Define la tabla Pedido en la base de datos 
 Almacena la informacion de los pedidos realizados por usuarios
 */

 //Importar DataTypes de sequelize
 const { DataTypes} = require('sequelize');

 //Importar instancia de sequelize
 const { sequelize } = require('../config/database');

 /**
  * Definir el modelo de Pedido
  */
 const Pedido = sequelize.define('Pedido', {
    //Campos de la tabla
    //Id Identificador unico (PRIMARY KEY)
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },

    // UsuarioId Id del usuario que realizo el pedido
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'Usuarios',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', //no se puede eliminar un usuario con pedidos
        validate: {
            notNull: {
                msg:'Debe especificar un usuario'
            }
        }
    },

    //Total monto total del pedido
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: {
                msg:'El total debe ser un numero decimal valido'
            },
            min: {
                args: [0],
                msg:'El total no puede ser negativo'
            }
        }
    },

    /**
     * Estado - estado actual del pedido
     * valores prosibles: pedido creado, esperando pago
     * pagado: pedido pagado, en preparacion
     * enviado: pedido enviado al cliente
     * cancelado: pedido cancelado
     */
    estado: {
        type: DataTypes.ENUM('Pendiente', 'Pagado', 'Enviado', 'Cancelado'),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn:{
                args: [['pendiente', 'pagado', 'enviado', 'cancelado']],
            }
        }
    },

     // Direccion de envio del pedido
     direccionEnvio: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'La direccion de envio es obligatoria'
            }
        }
    },

    // Telefono de contacto para el envio
    telefonoContacto: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'El telefono de contacto es obligatorio'
            }
        }
    },

    //Notas adicionales del cliente para el pedido (Opcional)
    notas: {
        type: DataTypes.TEXT,
        allowNull: true
    },

    //Fecha de pago
    fechaPago: {
        type: DataTypes.DATE,
        allowNull: true
    },

    //Fecha de Envio
    fechaEnvio: {
        type: DataTypes.DATE,
        allowNull: true
    },

    //Fecha de Entrega
    fechaEntrega: {
        type: DataTypes.DATE,
        allowNull: true
    },
 }, { 
    
    //Opciones del modelo

    tableName: 'pedidos',
    timestamps: true,
    //Indices para mejorar las busquedas
    indexes: [
        {
            // Indice para buscar carrito por usuario
            fields: ['usuariosId']
        },

        {
            // Indice para buscar pedidos por estado
            fields: ['estado']
        },

        {
            // Indice para buscar pedidos por fecha de creacion
            fields: ['createdAt']
        },
    ], 

    /**
    * Hooks acciones automaticas
    */

    hooks: {
        /**
         * beforeCreate - se ejecuta antes de crear un item en el carrito
         * valida que este esta activo y tenga stock suficiente
         *
        beforeCreate: async (itemCarrito) => {
            const Producto = require('./Producto');

            //Buscar el producto
            const producto = await Producto.findByPk(itemCarrito.productoId);

            if (!producto) {
                throw new Error ('El producto no existe');
            }

            if (!producto.activo) {
                throw new Error('No se puede agregar un producto inactivo al carrito');
            }

            if(!producto.hayStock(itemCarrito.cantidad)) {
                throw new Error(Stock insuficiente. Solo hay ${producto.stock} unidades disponibles);
            } 

            //Guardar el precio actual del producto
            itemCarrito.precioUnitario = producto.precio
        },*/

        /**
         * afterUpdate: se ejecuta despues de actualizar un pedido
         * Actualiza las fechas segun el estado del pedido 
         */
        afterUpdate: async (pedido) => {
            //Si el estado cambio o se actualizo a pagado, guarda la fecha de pago
            if (pedido.changed('estado') && pedido.estado === 'pagado') {
                    pedido.fechaPago = new Date();
                    await pedido.save() ({ hooks: false }); //Guardar sin ejecutar hooks para evitar bucles infinitos
            }

            //Si el estado cambio a enviado, guarda la fecha de envio
            if (pedido.changed('estado') && pedido.estado === 'enviado' && !pedido.fechaEnvio) {
                    pedido.fechaEnvio = new Date();
                    await pedido.save({ hooks: false }); //Guardar sin ejecutar hooks para evitar bucles infinitos
            }

            //Si el estado cambio a entregado, guarda la fecha de entrega
            if (pedido.changed('estado') && pedido.estado === 'entregado' && !pedido.fechaEntrega) {
                    pedido.fechaEntrega = new Date();
                    await pedido.save({ hooks: false }); //Guardar sin ejecutar hooks para evitar bucles infinitos
            }
        },
            /**
            * beforeDestroy: se ejecuta antes de eliminar un pedido
            */
            beforeDestroy: async () => {
                throw new Error('No se pueden eliminar pedidos. Si desea cancelar un pedido, cambie su estado a cancelado');
            }
        }
    });

 //METODOS DE INSTANCIA 
 /**
  * Metodo para cambiar el estado del pedido
  * @param {string} nuevoEstado - nuevo estado del pedido
  * @returns {number} - Subtotal (precio * cantidad)
  */

pedido.prototype.cambiarEstado = async function (nuevoEstado) {
    const estadosValidos = ['pendiente', 'pagado', 'enviado', 'cancelado'];

    if (!estadosValidos.includes(nuevoEstado)) {
        throw new Error(`estado invalido`);
    }
    
    this.estado = nuevoEstado;
    return await this.save();
};

/**
 * Metodo para verificar si el pedido puede ser cancelado
 * solo se pueden cancelar pedidos en estado pendiente o pagado
 * @returns {boolean} true si el pedido puede ser cancelado, false en caso contrario
 */
Pedido.prototype.puedeCancelar = function () {
    return ['pendiente', 'pagado'].includes(this.estado);
};

/**
 * Metodo para cancelar el pedido
 * @returns {Promise<Pedido>} - Pedido cancelado
 */
Pedido.prototype.cancelar = async function () {

    if (!this.puedeSerCancelar()) {
        throw new Error('Este pedido no puede ser cancelado');
    }

    //Importar modelos
    const DetallePedido = require('./DetallePedido');
    const Producto = require('./Producto');

    //Obtener detalles del pedido
    const detalles = await DetallePedido.findAll({
        where: { pedidoId: this.id }
    });

    //Devolver el stock de los productos del pedido
    for (const detalle of detalles) {
        const producto = await Producto.findByPk(detalle.productoId);
        await producto.incrementarStock(detalle.cantidad);
        console.log(`Stock devuelto: ${detalle.cantidad} X ${producto.nombre}`);
    }   
    
    //Cambiar estado a cancelado
    this.estado = 'cancelado';
    return await this.save();
};

/**
 * Metodo para obtener detalles del pedido con productos
 * @returns {Promise<Array>} - Detalles del pedido con informacion de los productos
*/
Pedido.prototype.obtenerDetalle = async function () {
    const DetallePedido = require('./DetallePedido');
    const Producto = require('./Producto');

    return await DetallePedido.findAll({
        where: { pedidoId: this.id },
        include: [
            {
                model: Producto,
                as: 'producto'
            }
        ]
    });
 };
 
 /**
  * Metodo para obtener el carrito completo de un usuario
  * incluye informacion de los productos 
  * @param {number} usuarioId - id del usuario
  * @return {Promise<Array>} - Items del carrito con productos 
  */
 Carrito.obtenerCarritoUsuario = async function (usuarioId) {
    const Producto = require('./Producto');

    return await this.findAll({
        where: { usuarioId},
        include: [
            {
                model: Producto,
                as: 'producto'
            }
        ],
        order: [['createdAt', 'DESC']]
    });
 };

 /**
  * Metodo para obtener pedidos por estado 
  * @param {string} estado estado del pedido a filtrar
  * @returns {Promise<Array>} Pedidos filtrados por estado
  */
    Pedido.obtenerPedidosPorEstado = async function (estado) {
        const Usuario = requiere ('./Usuario');
        return await this.findAll({
            where: {estado},
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'email']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
    };

 /**
  * Metodo para obtener historial de pedidos de un usuario
  * @param {number} usuarioId id del usuario
  * @returns {Promise<Array>} Pedidos del usuario
  */
 Pedido.obtenerHistorialusuario = async function (usuarioId) {
    return await this.findAll({
        where: { usuarioId },
        order: [['createdAt', 'DESC']]
    });
 };

//Exportar modelo
module.exports = Pedido;