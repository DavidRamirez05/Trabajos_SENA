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
    }  catch (error){
        console.error('Error en getCarrito:', error);
        res.status(500).json({
            success: false,
            message:'Error al obtener el carrito',
            error: error.message
        })
    }
};
/**
 * Agregar producto al carrito
 * POST/api/carrito
 * @param {object} req - Resquest de express
 * @param {object} res - Response de express
 */
const agregarAlCarrito = async (req, res) => {
    try {
        const { productoId, cantidad=1 } = req.body;
        //Validacion 1: Campos requeridos
        if (!productoId) {
            return res.status(400).json({
                success: false,
                message: 'El campo productoId es requerido'
            });
        }
        //Validacion 2: Cantidad valida
        if (cantidad <= 0) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser al menos 1'
            });
        }
        //Validacion 3: Producto existe y esta activo
        const producto = await Producto.findByPk(productoId);

        if (!producto) {
            return res.status(404).json({
                success: false,                
                message: 'Producto no encontrado'
            });
        }

        if (!producto.activo) {
            return res.status(400).json({
                success: false,
                message: 'El producto no está disponible'
            });
        }

        //Validacion 4: Verificarr si ya existe en el carrito
        const itemExistente = await Carrito.findOne({ 
            where: { 
                usuarioId: req.usuario._id, 
                productoId 
            } 
        });

        if (itemExistente) {
            //Si existe, actualizar cantidad
            const nuevaCantidad = itemExistente.cantidad + cantidadNum;

            //Validar stock disponible
            if (nuevaCantidad > producto.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Stock insuficiente. Stock disponible: ${producto.stock}. En carrito: ${itemExistente.cantidad}`
                });
            }

            itemExistente.cantidad = nuevaCantidad;
            await itemExistente.save();

            //Rescargar producto 
            await itemExistente.reload({
                include: [
                    {
                        model: Producto,
                        as: 'producto',
                        attributes: ['id', 'nombre', 'precio', 'stock', 'imagen'],
                    }
                ]
            });

            return res.json({
                success: true,
                message: 'Cantidad actualizada en el carrito',
                data: { 
                    item: itemExistente 
                }
            });
        }
        
        //Validacion 5: Verificar stock disponible
        if (cantidadNum > producto.stock) {
            return res.status(400).json({
                success: false,
                message: `Stock insuficiente. Stock disponible: ${producto.stock}`
            });
        }

        //Crear un nuevo item en el carrito
        const nuevoItem = await Carrito.create({
            usuarioId: req.usuario.id,
            productoId,
            cantidad: cantidadNum,
            precioUnitario: producto.precio
        });

        //Recargar el item con datos del producto
        await nuevoItem.reload({
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'precio', 'stock', 'imagen'],
                }
            ]
        });

        //Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Producto agregado al carrito',
            data: { 
                item: nuevoItem 
            }
        });
    } catch (error) {
        console.error('Error en agregarAlCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar producto al carrito',
            error: error.message
        });
    }
};

/**
 * Actualizar cantidad de item del producto
 * PUT /api/carrito/:id
 * Body { cantidad }
 * @param {object} req - Request de express
 * @param {object} res - Response de express
 */
const actualizarItemCarrito = async (req, res) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;

        //Validar cantidad
        const cantidadNum = parseInt(cantidad);
        if (cantidadNum < 1) {
            return res.status(400).json({
                success: false,
                message: 'La cantidad debe ser al menos 1'
            });
        }

        //Buscar el item del carrito
        const itemCarrito = await Carrito.findOne({
            where: { 
                id,
                usuarioId: req.usuario._id
            },
            include: [
                {
                    model: Producto,
                    as: 'producto',
                    attributes: ['id', 'nombre', 'precio', 'stock', 'imagen']
                }
            ]
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item del carrito no encontrado'
            });  
        }

        //Validar stock disponible
        if (cantidadNum > item.producto.stock) {
            return res.status(400).json({
                success: false,
                message: `Stock insuficiente. Disponible: ${item.producto.stock}`
            });
        }

        //Actualizar cantidad
        item.cantidad = cantidadNum;
        await item.save();

        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Cantidad del item actualizada',
            data: { 
                item 
            }
        });
    } catch (error) {
        console.error('Error en actualizarItemCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el item del carrito',
            error: error.message
        });
    }
};

/**
 * Eliminar item del carrito
 * Delete /api/carrito/:id
 */

const eleminarItemCarrito = async (req, res) => {
    try{
        const { id } = req.params;

        //Buscar item
        const item = await Carrito.findOne({
            where:{
                id,
                usuarioId: req.usuario.id
            }
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el carrito'
            });
        }

        //Eliminar item
        await item.destroy();
        
        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Item eliminado del carrito'
        });
    } catch (error) {
        console.error('Error en eliminarItemCarrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar el item del carrito',
            error: error.message
        });
    }
};