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
const Subcategoria = require('../models/Subcategoria');

//Importar path  y fs paramanejo de imagenes
const path = require('path'); //Trabaja con rutas de archivos
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

        if (buscar) {
          const { Op } = require('sequelize');
          where[Op.or] = [
            { nombre: { [Op.like]: `%${buscar}%` } },
            { descripcion: { [Op.like]: `%${buscar}%` } },
          ];
        }

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
            order: [['nombre', 'ASC']]
        };

        const { count, rows: productos } = await Producto.findAndCountAll(opciones);

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
        });
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

        res.json({
            success: true,
            data: { producto }
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

            if (!nombre || !precio || !stock || !categoriaId || !subcategoriaId) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre del producto, precio, stock, categoriaId y subcategoriaId son requeridos' 
                });
            }

        const categoria = await Categoria.findByPk(categoriaId);
        if (!categoria) {
            return res.status(400).json({
                success: false,
                message: `No existe la categoria con ID "${categoriaId}"`
            });
        }

        if (!categoria.activo) {
            return res.status(400).json({
                success: false,
                message: `La categoria "${categoria.nombre}" esta inactiva`
            });
        }

        const subcategoria = await Subcategoria.findByPk(subcategoriaId);

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
                message: `La subcategoria "${subcategoria.nombre}" no pertenece a la categoria con ID "${categoriaId}"`
            });
        }

        if (parseFloat(precio) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El precio debe ser mayor a 0'
            });
        }

        if (parseInt(stock) < 0) {
            return res.status(400).json({
                success: false,
                message: 'El stock debe ser un numero positivo'
            });
        }

        const imagen = req.file ? req.file.filename : null;

    const nuevoProducto = await Producto.create({
      nombre,
      descripcion: descripcion || null, 
      precio: parseFloat(precio),
      stock: parseInt(stock),
      categoriaId: parseInt(categoriaId),
      subcategoriaId: parseInt(subcategoriaId),
      imagen,
      activo: true
    });

    await nuevoProducto.reload({
      include: [
        { model: Categoria, as: 'categoria', attributes: ['id', 'nombre']},
        { model: Subcategoria, as: 'subcategoria', attributes: ['id', 'nombre']},
      ]
    });

    res.status(201).json({
      success: true,
      message: "Producto creado exitosamente",
      data: {
        producto: nuevoProducto,
      },
    });

  } catch (error) {
    console.error("Error en crearProducto: ", error);
    
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
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

/**
 * Actualizar producto
 * PUT /api/admin/productos/:id
 * Body: { nombre, descripcion, precio, stock, categoriaId, subcategoriaId}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, precio, stock, categoriaId, subcategoriaId } = req.body;

    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    if (categoriaId && categoriaId !== producto.categoriaId) {
      const categoria = await Categoria.findByPk(categoriaId);

      if (!categoria || !categoria.activo) {
        return res.status(400).json({
          success: false,
          message: `Categoria invalida o inactiva`,
        });
      };
    }
    
    if (subcategoriaId && subcategoriaId !== producto.subcategoriaId) {
      const subcategoria = await Subcategoria.findByPk(subcategoriaId);

      if (!subcategoria || !subcategoria.activo) {
        return res.status(400).json({
          success: false,
          message: `Subcategoria invalida o inactiva`,
        });
      };

      const catId = categoriaId || producto.categoriaId;
      if (subcategoria.categoriaId !== parseInt(catId)) {
          return res.status(400).json({
            success: false,
            message: 'La subcategoria no pertenece a la categoria seleccionada',
        });
      };
    }
  
      if (precio !== undefined && parseFloat(precio) < 0){ 
          return res.status(400).json({
            success: false,
            message: 'El precio debe ser mayor a 0'
          });
      }

      if (stock !== undefined && parseInt(stock) < 0) {
          return res.status(400).json({
            success: false,
            message: 'El stock debe ser mayor o igual a 0'
          });
        }

    if (req.file) {
      if (producto.imagen) {
        const rutaImagenAnterior = path.join(__dirname, '../uploads', producto.imagen);
        try {
          await fs.unlink(rutaImagenAnterior);
        } catch (err) {
          console.error('Error al eliminar imagen anterior: ', err);
        }
      }
      producto.imagen = req.file.filename;
    }

    if (nombre !== undefined) producto.nombre = nombre;
    if (descripcion !== undefined) producto.descripcion = descripcion;
    if (precio !== undefined) producto.precio = parseFloat(precio);
    if (stock !== undefined) producto.stock = parseInt(stock);
    if (categoriaId !== undefined) producto.categoriaId = parseInt(categoriaId);
    if (subcategoriaId !== undefined) producto.subcategoriaId = parseInt(subcategoriaId);

    await producto.save();

    res.json({
      success: true,
      message: "Producto actualizado exitosamente",
      data: { producto }
    });
  } catch (error) {
    console.error("Error en actualizarProducto: ", error);
    if (req.file) {
      const rutaImagen = path.join(__dirname, '../uploads', req.file.filename);
      try {
        await fs.unlink(rutaImagen);
      } catch (err) {
        console.error('Error al eliminar imagen: ', err);
      } 
    }

    if (error.name === "SequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar producto",
      error: error.message,
    });
  }
};

/**
 * Activa/Desactivar Producto
 * PATCH /api/admin/productos/:id/estado
 * @param {Object} req request express
 * @param {Object} res response express
 */

const toggleProducto = async (req, res) => {
  try {
    const { id } = req.params;

      const producto = await Producto.findByPk(id);

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: "Producto no encontrado",
        });
      }

      producto.activo = !producto.activo;
      await producto.save();
      
    res.json({
      success: true,
      message: `Producto ${producto.activo ? "activado" : "desactivado"} exitosamente`,
      data: { producto },
    });

  } catch (error) {
    console.error("Error en toggleProducto: ", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado del producto",
      error: error.message,
    });
  }
};

/**
 * Eliminar Producto
 * DELETE /api/admin/productos/:id
 * @param {Object} req request express
 * @param {Object} res response express
 */
const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    await producto.destroy();

    res.json({
      success: true,
      message: "Producto eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en eliminarProducto: ", error);
    res.status(500).json({
        success: false,
        message: "Error al eliminar producto",
        error: error.message
      });
  }
};

/**
 * Actualizar stock de un producto
 * PATCH /api/admin/productos/:id/stock
 * Body: { cantidad, operacion: "incrementar" o "disminuir" | "Establecer"}
 * @param {Object} req request express
 * @param {Object} res response express 
 */

    const actualizarStockProducto = async (req, res) => {
        try {
            const { id } = req.params;
            const { cantidad, operacion } = req.body;
            
            if (!cantidad || !operacion) { 
                return res.status(400).json({
                    success: false,
                    message: 'Se requiere cantidad y operacion'
                });
            }
            
            const cantidadNum = parseInt(cantidad);
            if (cantidadNum < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad debe ser un numero positivo'
                });
            }

            const producto = await Producto.findByPk(id);

            if (!producto) {
                return res.status(404).json({
                    success: false,
                    message: 'Producto no encontrado'
                });
            }

            const stockAnterior = producto.stock;
            let nuevoStock;

            switch (operacion) {
                case 'aumentar':
                    nuevoStock = producto.stock + cantidadNum;
                    break;
                case 'reducir':
                    if (cantidadNum > producto.stock) {
                        return res.status(400).json({
                            success: false,
                            message: `No hay suficiente stock. Stock actual: ${producto.stock}`
                        });
                    }
                    nuevoStock = producto.stock - cantidadNum;
                    break;
                case 'establecer':
                    nuevoStock = cantidadNum;
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Operacion invalida. Use "aumentar", "reducir" o "establecer"'
                    });
            }

            producto.stock = nuevoStock;
            await producto.save();

            res.json({
                success: true,
                message: `Stock  ${operacion} exitosamente.`,
                data: { 
                    productoId: producto.id,
                    nombre: producto.nombre,
                    stockAnterior,
                    stockNuevo: producto.stock 
                }
            });
        } catch (error) {
            console.error('Error en actualizarStock:', error);
            res.status(500).json({
                success: false,
                message: "Error al actualizar stock",
                error: error.message
            });
        }
    };

    //Exportar todos los controladores    
    module.exports = {
        getProductos,
        getProductosById,
        crearProducto,
        actualizarProducto,
        toggleProducto,
        eliminarProducto,
        actualizarStockProducto
    };