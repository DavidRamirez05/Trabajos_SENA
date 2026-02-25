/**
 * Controller de productos
 * maneja las operaciones crud y activar y desactivar categorias
 * solo accesible para administradores
 */

/**
 * Importar modelos
 */
const Producto = require('../models/Producto');
const Categoria = require('../models/Categoria');
const subcategoria = require('../models/subcategoria');

//Importar path  y fs paramanejo de imagenes
const path = require('path');
const fs = require('fs');

/**
 * Obtener todos los productos 
 * query params: 
 * categoriaId: Id de la categoria para filtrar productos por categoria
 * subcategoriaId: Id de la subcategoria para filtrar productos por subcategoria
 * activo: true/false para filtrar por estado activo
 * @param {Object} req request Express
 * @param {Object} res responde Express
 */

const getProductos = async (req, res) => {
    try {
        const { 
            categoriaId, 
            subcategoriaId,
            activo,
            conStock,
            buscar,
            pagina = 1,
            limite = 100,
        } = req.query;
        
        //Construir filtros
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (subcategoriaId) where.subcategoriaId = subcategoriaId;
        if (activo !== undefined) where.activo = activo === 'true';
        if (conStock === 'true') where.stock = { [require ('sequelize').Op.gt]: 0 };

        //Paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        //Opciones de consulta
        const opciones = {
            where,
            include: [
                {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre']
                },
                {
                    model: Subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre', 'descripcion']
                },
            ],
            limit: parseInt(limite),
            offset,
            order: [['createdAt', 'ASC']]
        };

        // Obtener productos y total
        const { count, rows: productos } = await Producto.findAndCountAll(opciones);

        //Respuesta Exitosa
        res.json({
            success: true,
            count: productos.length,
            data: {
                productos,
                total: count,
                pagina: parseInt(pagina),
                limite: parseInt(limite),
                totalPaginas: Math.ceil(count / parseInt(limite))
            }
        });

    } catch (error) {
        console.error('Error en getProductos; ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        })
    }
};

/**
 * Obtener las productos por Id
 * GET /api/productos/:id 
 * 
 * @param {Object} req request Express
 * @param {Object} res responde Express
 */

const getProductosById = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar productos con relacion 
        const producto = await Producto.findByPk(id, {
        include: [{
                model: Categoria,
                as: 'categoria',
                attributes: ['id', 'nombre', 'activo']
            },

            {
                model: Subcategoria,
                as: 'subcategoria',
                attributes: ['id', 'nombre', 'activo']
            }
        ]
        });

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        //Respuesta Exitosa
        res.json({
            success: true,
            data: {
                producto
            }
        });

    } catch (error) {
        console.error('Error en getproductosById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener producto',
            error: error.message
        })
    }
};

/**
 * Crea una Producto
 * POST /api/admin/productos
 * Body: { nombre, descripcion, precio, stock, categoriaId, subcategoriaId }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const crearProducto = async (req, res) => {
    try {
        const {nombre, descripcion, precio, stock, categoriaId, subcategoriaId} = req.body;

            //validacion 1 - verificar campos requiridos
            if (!nombre || !precio || !stock || !categoriaId || !subcategoriaId) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre del producto, precio, stock, categoriaId y subcategoriaId son requeridos' 
                });
            }

            /** 
            //Validacion 2 - verificar que el nombre no exista
            const productoExistente = await Producto.findOne({ where: {nombre}
            });

            if (productoExistente) {
                return res.status(400).json({
                    success: false,
                    message: `Ya exixste un producto con el nombre "${nombre}"`
                });
            }

            //Crear categoria
            const nuevaCategoria = await Categoria.create({
                nommbre,
                descripcion: descripcion || null, // si no se proporciona la descripcion se establece como null
                activo: true
            });

            //Respuesta exitosa
            res.status(201).json({
                success: true,
                message:'Categoria creada correctamente',
                data: {
                    categoria: nuevaCategoria
                }
            });
        */

        //Validacion 2 - verificar que la categoria ESTE ACTIVA
        const categoria = await Categoria.findByPk(categoriaId);
        if (!categoria) {
            return res.status(400).json({
                success: false,
                message: `No existe la categoria con ID "${categoriaId}" o esta inactiva`
            });
        }

        if (!categoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La categoria "${categoria.nombre}" esta inactiva`
            });
        }

        //Validacion 3 - verificar que la subcategoria existe y pertenezca a una categoria
        const subcategoria = await subcategoria.findByPk(subcategoriaId);

        if (!subcategoria) {
            return res.status(400).json({
                success: false,
                message: `No existe la subcategoria con ID "${subcategoriaId}"`
            });
        }

        if (!subcategoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria con ID "${subcategoriaId}" esta inactiva`
            });
        }

        if (subcategoria.categoriaId !== parseInt(categoriaId)) {
            return res.status(400).json({
                success: false,
                message: `La subcategoria "${subcategoriaId.nombre}" no pertenece a la categoria con ID "${categoriaId}"`
            });
        }
        // Validar el precio y Stock
        if (isNaN(precio) || parseFloat(precio) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe ser un numero positivo'
            });
        }

        if (isNaN(stock) || parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El stock debe ser un numero positivo'
            });
        }

        // Hasta aqui llegue


        
        //Crear producto
        const nuevoProducto = await Producto.create({
            nombre,
            descripcion: descripcion || null,
            precio,
            stock,
            categoriaId,
            subcategoriaId
        });

        //Respuesta exitosa
        res.status(201).json({
            success: true,
            message:'Producto creado correctamente',
            data: {
                producto: nuevoProducto
            }
        });

        } catch (error) {
            if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al crear categoria',
            error: error.message
        });
    }
};

/**Actualizar Categoria
 * PUT /api/admin/categorias/:id
 * body: {nombre, descripcion}
 * @param {Object} req request Express
 * @param {Object} res responde Express
 */

const actualizarCategoria = async (req, res) => {
    try {
        const {id} = req.params;
        const {nombre, descripcion} = req.body;

        //Buscar categoria
        const categoria = await Categoria.findByPk(id);
        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        //validacion 1 - si se cambia el nombre verificar que no exista
        if (nombre && nombre !== categoria.nombre) {
            const categoriaConMismoNombre = await Categoria.findOne({ where: {nombre}
            });

            if (categoriaConMismoNombre) {
                return res.status(400).json({
                    success: false,
                    message: `Ya existe una categoria con el mismo nombre "${nombre}"`
                });
            }
        }

        //Actualizar campos
        if (nombre !== undefined) categoria.nombre = nombre;
        if (descripcion !== undefined) categoria.descripcion = descripcion;
        if (activo !== undefined) categoria.activo = activo;

        // Guardar cambios
        await categoria.save();

        //Respuesta Exitosa
        res.json({
            success: true,
            message: 'Categoria actualizada exitosamente',
            data: {
                categoria
            }
        });

    } catch (error) {
        console.error('Error en actualizarCategoria: ', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json ({
            success: false,
            message: 'Error al actualizar la categoria',
            error: error.message
        });
    }
};

/**
 * Activar/Desactivar categoria
 * PATCH /api/admin/categorias/:id/estado
 * 
 * Al desactivar una categoria se desactivan todas las subcategorias relacionadas
 * Al desactivar una subcategoria se desactivan todos los productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const toggleCategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //Buscar categoria
        const categoria = await Categoria.findByPk(id);

        if(!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        //Alternar estado activo
        const nuevoEstado = !categoria.activo;
        categoria.activo = nuevoEstado;

        // Guardar cambios
        await categoria.save();

        //Contar cuantos registros se afectaron 
        const subcategoriasAfectadas = await Subcategoria.count({ where: { categoriaId:id}
        });

        const productosAfectadas = await Producto.count({ where: { categoriaId:id}
        });

        //Respuesta exitosa
        res.json({
            success: true,
            message: `Categoria ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente`,
            data:{
                categoria,
                afectados: {
                    subcategorias: subcategoriasAfectadas,
                    productos: productosAfectados
                }
            }
        });

    } catch (error) {
        console.error('Error en toggleCategoria: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar el estado de la categoria',
            error: error.message
        });
    }
};

/**
 * Eleminar categoria
 * DELETE /api/admin/categorias/:id
 * Solo se permite elemiar una categoria si no tiene subcategorias ni productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const eliminarCategoria = async (req, res) => {
    try {
        const {id} = req.params;

        //Buscar categoria
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        //Validacion verificar que no tenga subcategorias relacionadas
        const subcategorias = await Subcategoria.count({ where: { categoriaId:id}});

        if (subcategorias > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la categoria porque tiene ${subcategorias} subcategorias asociadas usa PATCH /api/admin/categorias/:id toggle para desactivarla en lugar de eleminarla`
            });
        }

        //Validacion verificar que no tenga productos
        const productos = await Producto.count({ where: { categoriaId:id}});
        
        if (subcategorias > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la categoria porque tiene ${productos} productos asociados usa PATCH /api/admin/categorias/:id toggle para desactivarla en lugar de eleminarla`
            });
        }

        //Eliminar categoria
        await categoria.destroy();
        
        //Respuesta exitosa
        res.json({
            success: true,
            message: 'Categoria eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error en eliminar categoria: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar categoria',
            error: error.message
        });
    }
};

/**
 * Obtener estadisticas de una categoria
 * GET /api/admin/categorias/:id/estadisticas
 * retorna
 * Total de subcategorias activas / inactivas
 * Total de productos activos / inactivos
 * Valor total de inventario
 * stock total 
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const getEstadisticasCategoria = async (req, res) => 
{
    try {
        const {id} = req.params;

        //Verificar que la categoria exista
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        //Contar subcategorias activas e inactivas
        const totalSubcategorias = await Subcategoria.count({ where: { categoriaId:id }});
        const subcategoriasActivas = await Subcategoria.count({ where: { categoriaId:id, activo:true}});

        //Contar prodcutos activos e inactivos
        const totalProductos = await Producto.count({ where: { categoriaId:id }});
        const productosActivos = await Producto.count({ where: { categoriaId:id, activo:true}});

        // Obtener productos para calcular estadisticas 
        const productos = await Producto.findAll({ 
            where: { categoriaId:id }, 
            attributes: ['precio', 'stock']
        });

        //Calcular estadisticas de inventario
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio) * producto.stock;
            stockTotal += producto.stock;
        });
    
        //Resúesta exitosa
        res.json({
            success: true,
            data: {
                id: categoria.id,
                nombre: categoria.nombre,
                activo: categoria.activo,
            },
            estadisticas: {
                subcategorias: {
                    total: totalSubcategorias,
                    activas: subcategoriasActivas,
                    inactivas: totalSubcategorias - subcategoriasActivas
                },
                productos: {
                    total: totalProductos,
                    activos: productosActivos,
                    inactivos: totalProductos - productosActivos
                },
                inventario: {
                    valorTotal: valorTotalInventario,
                    stockTotal: stockTotal
                }
            }
        });
    } catch (error) {
        console.error('Error en getEstadisticasCategoria: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas',
            error: error.message
        });
    }
}

//Exportar todos los controladores
module.exports = {
    getCategorias,
    getCategoriasById,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
    getEstadisticasCategoria
};