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

        //Validacion 1: Dirrecion requerida 
        if (!direccionEnvio) {
            return res.status(400).json({ error: 'La dirección de envío es requerida' });
        }

        //Validacion 2: Telefono requerido
        if (!telefono) {
            return res.status(400).json({ error: 'El teléfono es requerido' });
        }

        //Validacion 3: Metodo de pago requerido
        if (!metodoPago) {
            return res.status(400).json({ error: 'El método de pago es requerido' });
        }