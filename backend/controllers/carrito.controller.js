/**
 * CONTROLADOR PARA EL CARRITO DE COMPRAS
 * Gestion de carrito
 * Require autentication
 */

//Importamos el modelos
const Carrito = require('../models/Carrito');
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const Subcategoria = require('../models/Subcategoria');

/**
 * Obtener carrito del usuario autenticado
 * GET /api/carrito
 * @param {Object} req - request de express con req. usuario del middleware
 * @param {Object} res - response de express
 */
const getCarrito = async (req, res) => {
    try {
        // Obtener items del carrito con los productos relacionados
        const itemsCarrito = await Carrito.findAll({ where: { usuario: req.usuario._id },
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'descripcion', 'precio', 'stock', 'imagen', 'activo'],
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
                        }
                    ]
                }
            ]
        });

        //Calcular total del carrito
        let totalCarrito = 0;
        itemsCarrito.forEach(item => {
            totalCarrito += parseFloat(item.precioUnitario) * item.cantidad;
        });

        //Respuesta exitosa
        res.status(200).json({
            success: true,
            data: {
                items: itemsCarrito,
                resumen: {
                    totalItems: itemsCarrito.length,
                    CantidadTotal: itemsCarrito.reduce((sum, item) => sum + item.cantidad, 0),
                    totalCarrito: totalCarrito.toFixed(2)
                }
            }
        });
