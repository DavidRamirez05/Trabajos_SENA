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
        const itemsCarrito = await Carrito.findAll({ where: { usuario: req.usuario._id } })
            .populate({
                path: 'items.producto',
                populate: [
                    {
                        path: 'categoria',
                        model: Categoria
                    },
                    {
                        path: 'subcategoria',
                        model: Subcategoria
                    }
                ]
            });
        res.json({
            success: true,
            data: {
                carrito
            }
        });
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el carrito',
            error: error.message
        });
    }