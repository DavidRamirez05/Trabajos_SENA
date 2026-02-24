/**
 * Controller de subcategorias
 * maneja las operaciones crud y activar y desactivar subcategorias
 * solo accesible para administradores
 */

/**
 * Importar modelos
 */

const Subcategoria = require('../models/Subcategoria');
const Categoria = require('../models/Categoria');
const Producto = require('../models/Producto');

/**
 * Obtener todas las subcategorias
 * query params:
 * categoriaId: Id de la categoria para filtrar por categoria 
 * Activo true/false (filtrar por estado)
 * Incluir categorias true/false(incluir categorias relacionadas)
 * 
 * @param {Object} req request Express
 * @param {Object} res responde Express
 */

const getSubcategorias = async (req, res) => {
    try {
        const { categoriaId, activo, incluirCategoria} = req.query;

        //Opciones de consulta
        const opciones = {
            order: [['nombre', 'ASC']] //ordenar de manera alfabetica
        };

        //filtros
        const where = {};
        if (categoriaId) where.categoriaId = categoriaId;
        if (activo !== undefined) where.activo = activo === 'true';
        if (Object.keys(where),length > 0) {
            opciones.where = where;
        }


        //Incluir categorias si se solicita
        if (incluirCategoria === 'true') {
            opciones.include == [{
                model: Categoria,
                as: 'categorias', // Campo del alias para la relacion
                attributes: ['id', 'nombre', 'activo'] //Campos a incluir de la categoria
            }]
        }

        //Obtener Subcategorias
        const subcategoria = await Subcategoria.findAll (opciones);

        //Respuesta Exitosa
        res.json({
            success: true,
            count: subcategorias.length,
            data: {
                subcategorias
            }
        });

    } catch (error) {
        console.error('Error en getsubcategorias; ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener subcategorias',
            error: error.message
        })
    }
};

/**
 * Obtener las subcateogiras por Id
 * GET /api/subcategorias/:id 
 * 
 * @param {Object} req request Express
 * @param {Object} res responde Express
 */

const getSubcategoriasById = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar subcategorias con categoria y contar productos
        const subcategoria = await Subcategoria.findByPk ( id, {
        include: [{
                model: Categoria,
                as: 'categorias',
                attributes: ['id', 'nombre', 'activo']
            },
            {
                model: Producto,
                as: 'productos',
                attributes: ['id']
            }
        ]
        });

        if (!subcategoria) {
            return res.status(404).json({
                seccess: false,
                message: 'Subcategoria no encontrada'
            });
        }

        //Agregar contador de produtos
        const subcategoriaJSON = subcategoria.toJSON();
        subcategoriaJSON.totalProductos = subcategoriaJSON.productos.length;
        delete subcategoriaJSON.productos; //no enviar la lista completa solo el contador

        //Respuesta Exitosa
        res.json({
            success: true,
            data: {
                subcategoria: subcategoriaJSON
            }
        });

    } catch (error) {
        console.error('Error en getSubcategoriaById: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener subcategorias',
            error: error.message
        })
    }
};


/**
 * Crea una subcategoria
 * POST /api/admin/subcategorias
 * Body: { nombre, descripcion }
 * @param {Object} req request Express
 * @param {Object} res response Express
 */

const crearSubcategoria = async (res, res) => {
    try {
        const {nombre, descripcion, categoriaId} = req.body;

            //validacion 1 - velificar campos requiridos
            if (!nombre || !categoriaId) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre y categoriaId es requerido' 
                });
            }
            
            //validar 2 - Si la categoria existe
            const categoria = await Categoria.findByPk(categoriaId)
            if (!categoria) {
                return res.status(404).json({
                    success: false,
                    message: `No existe la categoria con id ${categoriaId}` 
                });
            }
           
            // Validacion 3 - verifica si la categoria este activa
            if (!categoria.activo) {
                return res.status(400).json({
                    success: false,
                    message: `La categoria con id ${categoriaId}`
                })
            }

            // Validacion 4 - Verificar que el nombre no existe una subcategoria
            cons

            //Validacion 2 verificar que el nombre no exista
            const categoriaExistente = await Categoria.findOne({ where: {nombre}
            });

            if (categoriaExistente) {
                return res.status(400).json({
                    success: false,
                    message: `Ya exixste una categoria con el nombre "${nombre}"`
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
        console.error('Error en toggleCategoria:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado de la categoria',
            error: error.message
        });
    }
};

/**
 * Eliminar categoria
 * DELETE /api/admin/categorias/:id
 * Solo permite eliminar si no tiene subcategorias ni productos relacionados
 * @param {Object} req request Express
 * @param {Object} res response Express
 */
const eliminarCategoria = async (req, res) => {
    try {
        const { id } = req.params;

        //Buscar categoria
        const categoria = await Categoria.findByPk(id);

        if (!categoria) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        //Validacion verificar que no tenga subcategorias
        const subcategorias = await Subcategoria.count({
            where: { categoriaId: id }
        });

        if (subcategorias > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la categoria porque tiene ${subcategorias} subcategorias asociadas, usa PATCH /api/admin/categorias/:id toogle para desactivarla en lugar de eliminarla `
            });
        }

        //Validacion verificar que no tenga productos
        const productos = await Producto.count({
            where: { categoriaId: id }
        });

        if (productos > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la categoria porque tiene ${productos} productos asociadas, usa PATCH /api/admin/categorias/:id toogle para desactivarla en lugar de eliminarla `
            });
        }

        //Eliminar categoria
        await categoria.destroy();

        //Respuesta Exitosa
        res.json({
            success: true,
            message: 'Categoria eliminada Exitosamente'
        });
    }  catch (error) {
        console.error('Error al eliminar categoria', error);
        res.status(400).json({
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
 * total de productos activos / inactivos
 * valor total del inventario
 * stock total
 * @param {Object} req request Express|}
 * @param {Object} res response Express
 */
const getEstadisticasCategoria = async (req, res) => {
    try {
        const { id } = req.params;

        //Verificar que la categoria exista
        const categoria = await Categoria.findByPk (id);

        if (!categoria) {
            return res.status(400).json({
                success: false,
                message: 'categoria no encontrada'
            });
        }

        //contar subcategorias 
        const totalSubcategorias = await Subcategoria.count({
            where: { categoriaId: id }
        });
        const subcategoriasActivas = await Subcategoria.count({
            where: { categoriaId: id, activo: true }
        });

        //contar productos
        const totalProductos = await Producto.count({
            where: { categoriaId: id }
        });
        const productosActivos = await Producto.count({
            where: { categoriaId: id, activo: true }
        });

        //obtener productos para calcular estadisticas
        const productos = await Producto.findAll({
            where: { categoriaId: id },
            attributes: ['precio', 'stock']
        });

        //calcular estadisticas de inventario
        let valorTotalInventario = 0;
        let stockTotal = 0;
        
        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio) * producto.stock;
            stockTotal += producto.stock;
        });

        //Respuesta Exitosa

        res.json({
            success: true,
            data: {
                categoria: {
                    id: categoria.id,
                    nombre: categoria.nombre,
                    activo: categoria.activo
                },
                estadisticas:{
                    subcategoria: {
                        total: totalSubcategorias,
                        activas: subcategoriasActivas,
                        inactivas: totalSubcategorias - subcategoriasActivas
                    },
                    productos: {
                        total: totalProductos,
                        activos: productosActivos,
                        inactivo: totalProductos - productosActivos
                    },
                    inventario: {
                        stockTotal,
                        valorTotal: valorTotalInventario.toFixed(2),//quitar decimales
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error en getEstadisticasCategoria: ', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas',
            error: error.message
        })
    }
};

//Exportar todos los controladores
module.exports = {
   getCategorias,
   getCategoriasById,
   crearCategoria,
   actualizarCategoria,
   toggleCategoria,
   eliminarCategoria,
   getEstadisticasCategoria 
};