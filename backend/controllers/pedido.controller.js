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
                message: 'Error de validación',
                errors: erroresValidacion
            });
        }