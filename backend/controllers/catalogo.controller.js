/**
 * Controller de catalogo
 * Permite ver los productos sin iniciar sesion
 * solo accesible para administradores
 */

/**
 * Importar modelos
 */
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const subcategoria = require('../models/subcategoria');

/**
 * Obtener todos los productos al publico
 * Get/api/catalogo/productos
 * query params: 
 * categoriaId: Id de la categoria para filtrar por categoria
 * subcategoriaId: Id de la subcategoria para filtrar por subcategoria
 * preciomin, preciomax, rango de precios nombre reciente
 * @param {Object} req request Express
 * @param {Object} res responde Express
 * Solo muestra los productos activos y con stock
 */

const getProductos = async (req, res) => {
    try {
        const { 
            categoriaId, 
            subcategoriaId,
            buscar,
            precioMin,
            precioMax,
            orden = 'reciente',
            pagina = 1,
            limite = 12,
        } = req.query;
        const { Op } = requiere('sequelize');
        
        //Filtros base solo para prodcutos activos y con stock
        const where = {
            activo: true,
            stock: { [Op.gt]:0 }
        };

        //Filtros opcionales
        if (categoriaId) where.categoriaId = categoriaId;
        if (subcategoriaId) where.subcategoriaId = subcategoriaId;

        //Busqueda de texto
        if(buscar){
            where[Op.or] = [
                { nombre: { [ Op.like]: `%${buscar}%`}}, //Permite buscar por nombre o descripcion
            ];
        }

        //Filtro por rango de precio
        if(precioMin && precioMax) {
            where.precio = {};
            if (precioMin) where.precio[Op.gte] = parseFloat(precioMin);
            if (precioMax) where.precio[Op.gte] = parseFloat(precioMax);
        }

        //Ordenamiento
        let order; 
        switch (order){
            case 'precio_asc':
                order = [['precio','ASC']];
                break;
            case 'precio_desc':
                order = [['precio','DESC']];
                break;
            case 'nombre':
                order = [['nombre','ASC']];
                break;
            case 'reciente':
                order = [['createdAt','DESC']];
                break;
        }

        //Paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        //Consultar productos
        const opciones = { count, rows: productos } = await Producto.findAndCountAll({
            where,
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true}
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true}
                },
            ],
            limit: parseInt(limite),
            offset,
            order: [['nombre', 'ASC']]
        });



        //respuesta exitosa
        res.json({
            success: true,
            data: {productos,
                paginacion: {
                    total: count,
                    pagina: parseInt(pagina),
                    limite: parseInt(limite),
                    paginasTotales: Math.ceil(count / parseInt(limite))
                },
            }
        });

    } catch (error) {
        console.error('Error en getProductos:', error); 
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        });         
    }
};

/**
 * Obtener el producto por id
 * GET /api/admin/productos/:id
 * 
 * @param {object} req - request express
 * @param {object} res - response express
 */


const getproductoById = async (req, res) => {
    try {
        const { id } = req.params;

        // Buscar productos con activo y stock
        const Producto = await producto.findOne({
            where: {
                id, 
                activo: true,
            },
            include: [{ 
                model: Categoria, 
                as: 'categoria',
                attributes: ['id', 'nombre', 'activo'],
                where: { activo: true}
        },
        {
            model: Subcategoria,
            as: 'subcategoria',
            attributes:['id','nombre','activo'],
            where: { activo: true }
        }
            ] 
     });

        if (!Producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado o no disponible'
            });
        }
        // Respuesta exitosa
        res.json({
            success: true,
            data: { 
                producto: productoJSON
             }
        });

    } catch (error) {
        console.error('Error en getProductoById:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        });
    }
};

/**
 * Obtener el producto por id
 * GET /api/admin/productos/:id
 * 
 * @param {object} req - request express
 * @param {object} res - response express
 */


const getCategorias = async (req, res) => {
    try {
        const { Op } = require('sequelize');

        // Buscar categorias activas
        const categorias = await Categoria.findAll({
            where: {activo: true},
            attributes: ['id', 'nombre', 'descripcion'],
            order: [['nombre', 'ASC']]
        });

        //Para cada categoria contar buscar productos activos con stock 
        const categoriasConConteo = await Promise.all(
            categorias.map(async (categoria) => {
                const totalProductos = await Producto.count({
                    where: {
                        categoriaId: categoria.id,
                        activo: true,
                        stock: { [Op.gt]: 0 }
                    }
                });
                return { ...categoria.toJSON(), totalProductos };
            })
        );

        // Respuesta exitosa
        res.json({
            success: true,
            data: { 
                categorias: categoriasConConteo
             }
        });

    } catch (error) {
        console.error('Error en getCategorias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorias',
            error: error.message
        });
    }
};

/**
 * Obtener las subcategorias por id
 * GET /api/admin/productos/:id
 * 
 * @param {object} req - request express
 * @param {object} res - response express
 */


const getSubcategoriasPorCategorias = async (req, res) => {
    try {
        const { id } = req.params;
        const { Op } = require('sequelize');

        // Verificar que la categoria exista y este activa
        const categorias = await Categoria.findOne({
            where: {id, activo: true},
        });
        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        // Buscar subcategorias activas
        const subcategorias = await Subcategoria.findAll({
            where: {
                categoriaId: id,
                activo: true
            },
            attributes: ['id', 'nombre', 'descripcion'],
            order: [['nombre', 'ASC']]
        });

        //contar productos activos con stock para cada subcategoria
        const subcategoriasConConteo = await Promise.all(
            subcategorias.map(async (subcategoria) => {
                const totalProductos = await Producto.count({
                    where: {
                        subcategoriaId: subcategoria.id,
                        activo: true,
                        stock: { [Op.gt]: 0 }
                    }
                });
                return { ...subcategoria.toJSON(), totalProductos };
            })
        );

        // Respuesta exitosa
        res.json({
            success: true,
            data: { 
                categoria: {
                    id: categoria.id,
                    nombre: categoria.nombre,
                },
                subcategorias: subcategoriasConConteo
             }
        });

    } catch (error) {
        console.error('Error en getSubcategoriasPorCategorias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorias',
            error: error.message
        })
    }
};
/**
 * Obtener productos destacados
 * GET /api/catalogo/destacados
 * 
 * @param {object} req - request express
 * @param {object} res - response express
 */


const getProductosDestacados = async (req, res) => {
    try {
        const { limite = 8 } = req.query;
        const { Op } = require('sequelize');

        // Obtener productos mas recientes
        const productos = await Producto.findAll({
            where: {
                activo: true, 
                stock: { [Op.gt]: 0 }
            },
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true }
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre'],
                    where: { activo: true }
                },
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limite)
        });

        // Respuesta exitosa
        res.json({
            success: true,
            data: { 
                productos
             }
        });

    } catch (error) {
        console.error('Error en getProductosDestacados:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos destacados',
            error: error.message
        });
    }
};

// Exportar todos los controladores
module.exports = {
    getProductos,
    getproductoById,
    getCategorias,
    getSubcategoriasPorCategorias,
    getProductosDestacados
};