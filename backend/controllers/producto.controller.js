/**
 * Controlador de productos
 * maneja las operaciones CRUD y activar and desactivar productos
 * solo accesible por administradores
 */

/**
 * Importar modelos
 */
const producto = require('../models/Producto');
const categoria = require('../models/Categoria');
const subcategoria = require('../models/Subcategoria');


// importar path y fs para manejo de imagenes 
const path = require('path');
const fs = require('fs');   
const { act } = require('react');

/**
 * Obtener todos los productos
 * query params:
 * categoriaID => filtrar por categoriaID
 * subcategoriaID => filtrar por subcategoriaID
 * - activo => true o false para filtrar por productos activos o inactivos
 * 
 * @param {object} req - request express
 * @param {object} res - response express
 */


const getProductos = async (req, res) => {
    try {
        const { activo,categoriaID, subcategoriaID, constock, buscar,pagina=1,limite=120 } = req.query;


        // construir filtros 
            const where = {};

        if (categoriaID)    where.categoriaID = categoriaID;
        if (subcategoriaID)  where.subcategoriaID = subcategoriaID;
        if (activo !== undefined) where.activo = activo === 'true';
        if (constock === 'true') where.stock = { [Op.gt]: 0 };

        //paginacion
        const offset = (parseInt(pagina) - 1) * parseInt(limite);
        

        /**
         * opciones de consulta
         */
        const opciones = {
            where,
            include: [
                {
                    model: categoria,
                    as: 'categoria',
                    attributes: ['id', 'nombre'] // campos a incluir de categoria
                },
                {
                    model: subcategoria,
                    as: 'subcategoria',
                    attributes: ['id', 'nombre',] // campos a incluir de subcategoria
                }
                
            ],
            limit : parseInt(limite),
            offset,
            order: [['nombre', 'ASC']]
            // ordenar por nombre ascendente
        };

        //obtener productos y total
        const { count, rows: productos } = await producto.findAndCountAll(opciones);

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

        // Buscar productos con relacion 
        const Producto = await producto.findByPk(id, {
            include: [{ 
                model: categoria, 
                as: 'categoria',
                attributes: ['id', 'nombre', 'descripcion', 'activo'],
        },
        {
            model: subcategoria,
            as: 'subcategoria',
            attributes:['id','nombre','descripcion','activo']
                }
            ] 
     });

        if (!Producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        // agregar contador de productos a la respuesta
        const productoJSON = Producto.toJSON();
        productoJSON.totalProductos= productoJSON.productos.length;
        delete productoJSON.productos; // eliminar el array de productos para no enviar datos innecesarios
        //Incluir subcategorias si se especifica

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
 * crear un producto 
 * POST /api/admin/productos
 * body: {nombre, descripcion, precio, categoriaId}
 * @param {object} req - request express
 * @param {object} res - response express
 */


const crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, subcategoriaID,categoriaId } = req.body;

        // Validacion 1 verificar campos requeridos
        if (!nombre || !precio  || !categoriaId || !subcategoriaID) {
            return res.status(400).json({
                success: false,
                message: 'El nombre, precio, stock, subcategoriaID y categoriaId son requeridos'
            });

        }
        /**
        // Validacion 2 verificar que no exista una producto con el mismo nombre
        const productoExistente = await producto.findOne({ where: { nombre } });
        if (productoExistente) {
            return res.status(400).json({
                success: false,
                message: `Ya existe una producto con ese nombre "${nombre}"`
            });
    }     */

        // Validacion 2 verificar que la categoria exista y este activa
        const Categoria = await categoria.findByPk(categoriaId);
        if (!Categoria) {
         return res.status(400).json({
            success: false,
            message: `La categoria "${categoriaId}" no existe`
         });
        }
        if (!Categoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La categoria "${Categoria.nombre}" esta inactiva no se pueden crear productos en categorias inactivas`
            });
        }
        // Validacion 3 verificar que la subcategoria existe y pertenece a una categoria
        const Subcategoria = await subcategoria.findByPk(subcategoriaID);
        if (!Subcategoria) {
            return res.status(404).json({
                success: false,
                message: `La subcategoria "${subcategoriaID}" no existe`
            });
        }
            if (Subcategoria.activo !== categoriaId) {
            return res.status(400).json({
                success: false, 
                message: `La subcategoria "${Subcategoria.nombre}" esta inactiva no se pueden crear productos en subcategorias inactivas`
            });
        }
        
        if (Subcategoria.categoriaID !== parseInt(categoriaId)) {
            return res.status(400).json({
                success: false, 
                message: `La subcategoria "${Subcategoria.nombre}" no pertenece a la categoria "${Categoria.nombre}"`
            });
        }

        // validacion 4 validar el precio y stock sean numeros positivos
        if (parseFloat(precio) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe ser un numero positivo'
            });
        }
        if (parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El stock debe ser un numero entero positivo'
            });
        }

        //obtener imagen
        const imagen = req.file ? req.file.filename : null;

        // Crear producto
        const nuevoProducto = await producto.create({
            nombre,
            descripcion: descripcion || null,
            precio: parseFloat(precio).toFixed(2), // formatear a 2 decimales
            stock: parseInt(stock),
            imagen,
            subcategoriaID: parseInt(subcategoriaID),
            categoriaId: parseInt(categoriaId),
            activo: true
        });


        // recargar con relaciones
        await nuevoProducto.reload({
            include: [
                {   model: categoria, as: 'categoria', attributes: ['id', 'nombre']},
                {   model: subcategoria, as: 'subcategoria', attributes: ['id', 'nombre']}
            ]
        });

        // Respuesta exitosa
        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: { producto: nuevoProducto }
        });
    } catch (error) {
        console.error('Error en crearProducto:', error);

        //si hubo un error eliminar la imaggen subida
        if (req.file) {
            const rutaImagen = path.join(__dirname, '..', 'uploads', req.file.filename);
            try {
                await fs.unlink(rutaImagen);
            } catch (err) {
                console.error(`Error al eliminar imagen`, err);
            }
        }

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }
    }
};      



/**
 * Actualizar un producto
 * PUT /api/admin/productos/:id
 * body: {nombre, descripcion, precio, stock, activo, categoriaID, subcategoriaID}
 * @param {object} req - request express
 * @param {object} res - response express
 */

const actualizarProducto = async (req, res) => {
    try {   
        const { id } = req.params;
        const { nombre, descripcion, precio, stock, activo, categoriaID,subcategoriaID } = req.body;
        // Buscar producto
        const producto = await producto.findByPk(id);
       
       
        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        // validacion 1 si se cambia el nombre verificar que no exista
        if (categoriaID&& categoriaID !== producto.categoriaID) {
            const Categoria = await categoria.findOne(categoriaID);

            if (Categoria || !Categoria.activo) {
                return res.status(404).json({
                    success: false,
                    message: `CATEGORIA INVALIDA O INACTIVA`
                });
            }
        }
        if (subcategoriaID&& subcategoriaID !== producto.subcategoriaID) {
            const Subcategoria = await subcategoria.findOne(subcategoriaID);

            if (Subcategoria || !Subcategoria.activo) {
                return res.status(404).json({
                    success: false,
                    message: `SUBCATEGORIA INVALIDA O INACTIVA`
                });
            }

            const catID = categoriaID || producto.categoriaID; // usar el nuevo categoriaID si se proporciona, de lo contrario usar el existente
            if (Subcategoria.CategoriaID !== parseInt(catID)) {
                return res.status(400).json({
                    success: false,
                    message: `SUBCATEGORIA NO PERTENECE A LA CATEGORIA SELECCIONADA`
                });
            }
        }

        // validacion 2 validar el precio y stock sean numeros positivos
        if (precio !== undefined && parseFloat(precio) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe ser un numero positivo'
            });
        }
        if (stock !== undefined && parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El stock debe ser un numero entero positivo'
            });
        }

        // validacion 3 si se actualiza la imagen eliminar la anterior
        if (req.file) {
            // eliminar imagen anterior si existe
            if (producto.imagen) {
                const rutaImagen = path.join(__dirname, '..', 'uploads', producto.imagen);
                try {
                    await fs.unlink(rutaImagen);
                } catch (err) {
                    console.error(`Error al eliminar imagen anterior`, err);
                }
            }
            producto.imagen = req.file.filename;    
        }

        if(!nuevaCategoria.activo){
            return res.status(400).json({
                success: false,
                message: 'No se puede asignar una categoria inactiva'
            });
        }

        //actualizar campos
        if(nombre!== undefined) producto.nombre = nombre;
        if(descripcion !== undefined) producto.descripcion = descripcion;
        if(precio !== undefined) producto.precio = parseFloat(precio);
        if(stock !== undefined) producto.stock = parseInt(stock);
        if(activo !== undefined) producto.activo = activo;
        if(categoriaID !== undefined) producto.categoriaID =parseInt(categoriaID);
        if(subcategoriaID !== undefined) producto.subcategoriaID = parseInt(subcategoriaID);


        //guardar cambios
        await producto.save();

        // Respuesta exitosa
        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: { producto }
        });

    } catch (error) {
        console.error('Error en actualizarProducto:', error);
        if (req.file) {
          const rutaImagen = path.join(__dirname, '../uploads', req.file.filename);
          try {
            await fs.unlink(rutaImagen);
          } catch (err) {
            console.error('Error al eliminar imagen: ', err);
          }
        }

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Error de validacion',
                errors: error.errors.map(e => e.message)
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error al actualizar producto',
            error: error.message
        });
    }

};

/**
 * Activar o desactivar un producto
 * PATCH /api/admin/productos/:id/estado
 * 
 * Al desactivar un producto se desactivan todas las subcategorias relacionadas
 * @param {object} req - request express
 * @param {object} res - response express
 */

const toggleproducto = async (req, res) => {
    try {
        const { id } = req.params;
        // Buscar producto
        const producto = await producto.findByPk(id);


        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        producto.activo = !producto.activo;
        await Producto.save();

        // Respuesta exitosa
        res.json({
            success: true,
            message: `Producto ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`,
            data: {
                producto
            }
        });
    } catch (error) {
        console.error('Error en toggleProducto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cambiar estado de producto',
            error: error.message
        });
    }
};
    /**
     * Eliminar un producto
     * DELETE /api/admin/productos/:id
     * solo eliminar cuando no tenga subcategorias ni productos relacionados
     * @param {object} req - request express
     * @param {object} res - response express
     */
    const eliminarProducto = async (req, res) => {
        try {
            const { id } = req.params;
            // Buscar producto
            const producto = await producto.findByPk(id);

            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }
            //validar verificacion que no tenga productos relacionados
            const subcategorias = await subcategoria.count({
                where: { categoriaID: id }
                });
                if (subcategorias > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `No se puede eliminar el producto porque tiene ${subcategorias} subcategorias asociadas usa 
                        PATCH /api/admin/productos/:id/toogle para desactivarlo en lugar de eliminarlo`
                    });
                }
            //validar verificacion que no tenga productos relacionados
            const productos = await producto.count({
                 where: { categoriaID: id } 
                });
                if (productos > 0) {
                    return res.status(400).json({
                        success: false,
                        message: `No se puede eliminar el producto porque tiene ${productos} productos asociados usa 
                        PATCH /api/admin/productos/:id toogle para desactivarlo en lugar de eliminarlo`
                    });
                }
            // Eliminar producto
            await producto.destroy();

            // Respuesta exitosa
            res.json({
                success: true,
                message: 'Producto eliminado exitosamente'
            });
        }catch (error) {
            console.error('Error en eliminarProducto:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar producto',
                error: error.message
            });
        }
    };

    /**
     * obtener estadisticas de un producto
     * GET /api/admin/productos/:id/estadisticas retorna
     * Total de productos activos e inactivos
     * valor total del inventario (precio * stock)
     * stock total
     * @param {object} req - request express
     * @param {object} res - response express
     */

const getEstadisticasProducto = async (req, res) => {
    try {
        const { id } = req.params;
        // verificar que el producto exista
        const producto = await producto.findByPk(id);

        if (!producto) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }
        // contar subcategorias
        const totalSubcategorias = await subcategoria.count({
                where: { categoriaID: id,}
        });
        const subcategoriasActivas = await subcategoria.count({
                where: { categoriaID: id, activo: true }
        });
        // contar productos
        const totalProductos = await producto.count({
                where: { categoriaID: id,}
        });
        const productosActivos = await producto.count({
                where: { categoriaID: id, activo: true }
        });
        // obtener productos  para calcular estadisticas
        const productos = await producto.findAll({
                where:{categoriaID:id},
                attributes:['precio','stock']
        });

        //Calcular estadisticas de inventario
        let valorTotalInventario = 0;
        let stockTotal = 0;

        productos.forEach(producto => {
            valorTotalInventario += parseFloat(producto.precio) * producto.stock;
            stockTotal += producto.stock; 
        });
        // Respuesta exitosa
        res.json({
            success: true,
            data: {
                categoria: {
                    id: categoria.id,
                    nombre: categoria.nombre,
                    activo: categoria.activo
                },
                estadisticas:{
                    subcategorias:{
                        total: totalSubcategorias,
                        activas: subcategoriasActivas,
                        inactivas: totalSubcategorias - subcategoriasActivas
                    },
                    productos:{
                        total: totalProductos,
                        activos: productosActivos,
                        inactivos: totalProductos - productosActivos
                    },
                    inventario:{
                        stockTotal,
                        valorTotal: valorTotalInventario.toFixed(2),// quitar los decimales
                    },
                }
    }
        });
    } catch (error) {
        console.error('Error en getEstadisticasCategoria:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadisticas de categoria',
            error: error.message
        });
    }
};

module.exports = {
    getProductos,
    getproductoById,
    crearProducto,  
    actualizarProducto,
    toggleproducto,
    eliminarProducto,
    getEstadisticasProducto
};