/**
 * CONTROLAR PEDIDOS
 * Gestion de pedidos
 * Requiere Autenticacion
 */

// Importar modelos
const Pedido = require('../models/Pedido');
const DetallePedido = require('../models/DetallePedido');
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Usuario = require('../models/Usuario');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');
const e = require('cors');

/**
 * Crear pedido desde el carrito (Checkout)
 * POST/api/clientes/pedidos
 */

const crearPedido = async (req, res) => {
    const { sequelize } = require('../config/database');
    const t = await sequelize.transaction();

    try {
        const { direccionEnvio, telefono, metodoPago = 'efectivo', notasAdicionales } = req.body;

        //Dirrecion requerida 
        if (!direccionEnvio || direccionEnvio.trim() === '') {
            await t.rollback();
            return res.status(400).json({ 
                succes: false,
                message: 'La dirección de envío es requerida' 
            });
        }

        //Telefono requerido
        if (!telefono || telefono.trim() === '') {
            await t.rollback();
            return res.status(400).json({
                succes: false,
                message: 'El teléfono de contacto es requerido'
            });
        }

        //Metodo de pago requerido
        const metodosValidos = ['efectivo', 'tarjeta', 'paypal'];
        if (!metodosValidos.includes(metodoPago)) {
            await t.rollback();
            return res.status(400).json({
                succes: false,
                message: `Metodo de pago invalido, opciones; ${metodosValidos.join(", ")}`
            });
        }

        //Obtner items del carrito

        const carritoItems = await Carrito.findAll({
            where: { usuarioId: req.usuario.id },
            include: {
                model: Producto,
                as: 'producto',
                attributes: ['id', 'nombre', 'precio', 'stock', 'activo']
            },
            transaction: t
        });

        if (itemsCarrito.length === 0) {
            await t.rollback();
            return res.status(400).json({
                succes: false,
                message: 'El carrito esta vacio'
            });
        }

        //Verificar stock y productos activos
        const erroresValidacion = [];
        let totalPedido = 0;

        for (const item of itemsCarrito) {
            const producto = item.producto;

            // Verificar si el producto esta activo
            if (!producto.activo) {
                erroresValidacion.push(`El producto ${producto.nombre} no esta disponible`);
                continue;
            }

            // Verificar stock suficiente
            if (item.cantidad > producto.stock) {
                erroresValidacion.push(`No hay suficiente stock. (Stock disponible: ${producto.stock}) solicitado: ${item.cantidad}`);
            continue;
            }

            // Calcular total del pedido
            totalPedido += parseFloat(item.precioUnitario) * item.cantidad;
        }

        // Si hay errores de validacion, retornar respuesta
        if (erroresValidacion.length > 0) {
            await t.rollback();
            return res.status(400).json({
                succes: false,
                message: 'Error en validación de carrito',
                errors: erroresValidacion
            });
        }

        //Crear pedido
        const Pedido = await Pedido.create({
            usuarioId: req.user.usuarioid,
            total: totalPedido,
            estado: 'pendiente',
            direccionEnvio,
            telefono,
            metodoPago,
            notasAdicionales,
        }, { transaction: t });

        //Crear detalles del pedido y actualizar stock
        const  detallePedidos = [];

        for (const item of itemsCarrito) {
            const producto = item.producto;

            //Crear detalle del pedido
            const detalle = await DetallePedido.create({
                pedidoId: pedido.id,
                productoId: producto.id,
                cantidad: item.cantidad,
                precioUnitario: item.precioUnitario,
                subtotal: parseFloat(item.precioUnitario) * item.cantidad
            }, { transaction: t });

            detallesPedido.push(detalle);

            //Reducir stock del producto
            producto.stock -= item.cantidad;
            await producto.save({ transaction: t });
        }

        //Vaciar carrito
        await Carrito.destroy({
            where: { usuarioId: req.usuario.id },
            transaction: t
        });

        //Confirmar transaccion
        await t.commit();

        //Cargar pedido con relaciones
        await pedido.reload({
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'email']
                },
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: {
                        model: Producto,
                        as: 'producto',
                        attributes: ['id', 'nombre', 'precio', 'imagen']
                    }
                }
            ]
        });

        //Respuesta exitosa
        res.status(201).json({
            succes: true,
            message: 'Pedido creado exitosamente',
            data: {
                pedido,
            }
        });

    } catch (error) {
        //Revertir transaccion en caso de error
        await t.rollback();
        console.error('Error al crear pedido:', error);
        res.status(500).json({
            succes: false,
            message: 'Error al crear el pedido',
            error: error.message
        });
    }
};

/**
 * Obtener pedidos del cliente
 * GET/api/clientes/pedidos
 * query: ?estado=pendiente&pagina=1&limite=10
 */

const getMisPedidos = async (req, res) => {
    try {
        const { estado, pagina = 1, limite = 10 } = req.query;
        
        //Filtros 
        const where = { usuarioId: req.usuario.id };
        if (estado) where.estado = estado;

        //Paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        //Consultar pedidos
        const { count, rows: pedidos } = await Pedido.findAndCountAll({
            where,
            include: [
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include:  [{
                        model: Producto,
                        as: 'producto',
                        attributes: ['id', 'nombre', 'imagen']
                    }]
                }
            ],
            limit: parseInt(limite),
            offset,
            order: [['createdAt', 'DESC']]
        });
    
    //Respuesta exitosa
    res.json({
        succes: true,
        data: {
            pedidos,
            paginacion: {
                total: count,
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                totalPaginas: Math.ceil(count / parseInt(limite))
            }
        }
    });
    } catch (error) {
        console.error('Error en getMisPedidos:', error);
        res.status(500).json({
            succes: false,
            message: 'Error al obtener los pedidos',
            error: error.message
        });
    }
};

/**
 * Obtener un pedido especifico por ID
 * GET/api/cliente/pedidos/:id
 * Solo el admin puede ver todos los pedidos
 */

const getPedidoById = async (req, res) => {
    try {
        const { id } = req.params;

        //Construir filtros (Cliente solo puede ver sus pedidos, admin puede ver todos)
        const where = { id };
        if (req.usuario.rol !== 'administrador') {
            where.usuarioId = req.usuario.id;
        }

        //Buscar pedido
        const pedido  = await Pedido.findOne({
            where,
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['id', 'nombre', 'email']
                },
                {
                    model: DetallePedido,
                    as: 'detalles',
                    include: {
                        model: Producto,
                        as: 'producto',
                        attributes: ['id', 'nombre', 'descripcion', 'imagen'],
                        include: [
                            {
                                model: Categoria,
                                as: 'categoria',
                                attributes: ['id', 'nombre']
                            },
                            {
                                model: Subcategoria,
                                as: 'subcategoria',
                                attributes: ['id', 'nombre']
                            },
                        ]
                    }
                }
            ]
        });
         
        //Respuesta exitosa
        res.json({
            succes: false,
            data: {
                pedido
            }
        });
    } catch (error) {
        console.error('Error en getPedidoById:', error);
        res.status(500).json({
            succes: false,
            message: 'Error al obtener el pedido',
            error: error.message
        });
    }
};

/**
 * Cancelar pedido
 * Put/api/cliente/pedidos/:id/cancelar
 * Solo se puede cancelar si el estado es pendiente
 * Devuelve el stock a los productos
 */

const cancelarPedido = async (req, res) => {
    const { sequelize } = require('../config/database');
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;

        //Buscar pedido solo los propios pedidos
        const pedido = await Pedido.findOne({
            where: {
                id,
                usuarioId: req.usuario.id
            },
            include: [{
                model: DetallePedido,
                as: 'detalles',
                include: [{
                    model: Producto,
                    as: 'producto',
                }]
            }],
            transaction: t
        });
        
        if (!pedido) {
            await t.rollback();
            return res.status(404).json({
                succes: false,
                message: 'Pedido no encontrado'
            });
        }

        //Solo se puede cancelar si esta en pendiente 
        if (pedido.estado !== 'pendiente') {
            await t.rollback();
            return res.status(400).json({
                succes: false,
                message: `No se puede cancelar un pedido en estado '${pedido.estado}'`
            });
        }

        //Devolver stock de los productos
        for (const detalle of pedido.detalles){
            const producto = detalle.producto;
            producto.stock += detalle.cantidad;
            await producto.save({ transaction: t });
        }

        //Actualizar estado del pedido
        pedido.estado = 'cancelado';
        await pedido.save({ transaction: t});

        await t.commit();

        //Respuesta exitosa
        res.json({
            succes: true,
            message: 'Pedido cancelado exitosamente',
            data: {
                pedido
            }
        });
    }
}