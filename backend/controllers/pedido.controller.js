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