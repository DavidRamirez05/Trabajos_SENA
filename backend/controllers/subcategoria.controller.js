/**
 * controlador de subcategorias
 * maneja las operaciones crud y activar y desactivar subcategorias
 * solo accesible por administradores
 */

/**
 * Importar modelos
 */

const Subcategoria = require(".../models/Subcategoria");
const Categoria = require(".../models/categoria");
const Producto = require(".../models/producto");

/**
 * obtener todas las subcategorias
 * query params:
 * categoriaId: Id de la categoria para filtrar por categoria
 * Activo: true/false (filtrar por estado)
 * incluir categorias: true/false (Incluir categorias relacionadas)
 *
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getSubcategorias = async (req, res) => {
  try {
    const { categoriaId, activo, IncluirCategorias } = req.query;

    //filtros
    const where = {};
    if (categoriaId) where.categoriaId = categoriaId;
    if (activo != undefined) where.activo = activo === "true";

    if (Object.keys(where).length > 0) {
      opciones.where = where;
    }

    // Opciones de consulta
    const opciones = {
      order: [["nombre", "ASC"]], // ordenar de manera alfabetica
    };

    // Incluir categorias si se solicita
    if (IncluirCategorias === "true") {
      opciones.include = [
        {
          model: Categoria,
          as: "Categorias", //campo de alias para la relacion
          attributes: ["id", "nombre", "activo"], //campos a incluir de la categoria
      }];
    }

    //obtener subcategorias
    const subcategorias = await Subcategoria.findAll(opciones);
    

    //Respuesta Exitosa
    res.json({
      success: true,
      count: subcategorias.length,
      data: {
        subcategorias,
      },
    });

  } catch (error) {
    console.error("Error en getSubcategorias:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener las subcategorias",
      error: error.message,
    })
  }
};

/**
 * obtener todas las subcategorias
 * GET /api/subcategorias/:id
 *
 * @param {Object} req request express
 * @param {Object} res response express
 */

const getSubcategoriaById = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar subcategorias con categoria y contar productos
    const subcategoria = await Subcategoria.findByPk(
      id,{
        include: {
        model: Categoria,
          as: "categorias",
          attributes: ["id", "nombre", "activo"],
        },
      },
      {
        model: Producto,
        attributes: ["id"],
      },
    );

    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        message: "Subcategoria no encontrada",
      });
    }

    //agregar contador de productos
    const subcategoriaJSON = subcategoria.toJSON();
    subcategoriaJSON.totalProductos = subcategoriaJSON.productos.length;
    delete subcategoriaJSON.productos; //no enviar la lista completa solo el contador

    //Respuesta Exitosa
    res.json({
      success: true,
      data: {
        subcategoria: subcategoriaJSON,
      },
    });
  } catch (error) {
    console.error("Error en getSubcategoriaById:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener subcategoria",
      error: error.message,
    });
  }
};

/**
 * Crear una subcategoria
 * POST /api/admin/subcategorias
 * Body: { nombre, descripcion, categoriaId}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const crearSubcategoria = async (req, res) => {
  try {
    const { nombre, descripcion, categoriaId } = req.body;

    //validacion 1 verificar campos requeridos
    if (!nombre || !categoriaId) {
      return res.status(400).json({
        success: false,
        message: "El  nombre y categoriaId es requerido",
      });
    }

    //validar si la categoria existe
    const categoria = await Categoria.findByPk(categoriaId);
    if (!categoria) {
      return res.status(400).json({
        success: false,
        message: `no existe la categoria con id ${categoriaId}`,
      });
    }

    // validacion 3 verificar  si la categoria esta activa
      if(!Categoria.activa){
        return res.status(400).json({
          sucess :false,
          message:' la categoria con id ${categoria.nombre} esta inactiva'
        })
      }

      //validacion 4 verificar que el nombre no exista una subcategoria con el mismo nombre
        

    const subcategoriaExistente = await Subcategoria.findOne({ where: { nombre } });

    if (subcategoriaExistente) {
      return res.status(400).json({
        success: false,
        message: `Ya existe una subcategoria con el nombre "${nombre}"`,
      });
    }
  
    //Crear subcategoria
    const nuevaSubcategoria = await Subcategoria.create({
      nombre,
      descripcion: descripcion || null, //si no se proporciona la descipcion se establece como null
      categoriaId: categoriaId,
      activo: true,
    });

    // obtener subcategoria con los datos de la categoria
    const subcategoriaCreada = await Subcategoria.findByPk(nuevaSubcategoria.id, {
      include: [{
        model: Categoria,
        as: "categorias",
        attributes: ["id", "nombre", "activo"],
      }],
    });

    //Respuesta exitosa
    res.status(201).json({
      success: true,
      message: "Subcategoria creada exitosamente",
      data: {
        subcategoria: subcategoriaconCategoria,
      },
    });

  } catch (error) {
    console.error("Error en crearSubcategoria: ", error);
    return res.status(400).json({
      success: false,
      message: "Error de validacion",
      errors: error.errors.map((e) => e.message),
    });
  }

  res.status(500).json({
    success: false,
    message: "Error al crear subcategoria",
    error: error.message,
  });
};

/**
 * Actualizar subcategoria
 * PUT /api/admin/subcategorias/:id
 * Body: { nombre, descripcion, categoriaId}
 * @param {Object} req request express
 * @param {Object} res response express
 */

const actualizarSubcategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, categoriaId } = req.body;

    //Buscar subcategoria
    const subcategoria = await Subcategoria.findByPk(id);

    if (!subcategoria) {
      return res.status(404).json({
        success: false,
        message: "Subcategoria no encontrada",
      });
    }

    //validacion 1 si se cambia el nombre verificar que no exista
    if (categoriaId && categoriaId  !== subcategoria.categoriaId) {
      const nuevacategoria = await Categoria.findByPk(categoriaId);
      if (!nuevacategoria) {
        return res.status(400).json({
          success: false,
          message: `No existe la categoria con id ${categoriaId}`,
        });
      }

      if(!nuevacategoria.activa){
        return res.status(400).json({
          success :false,
          message:` la categoria con id ${nuevacategoria.nombre} esta inactiva`
        });
      }
    }
    // validacion si se cambia el nombre verificar que no exista la categoria
    if (nombre && nombre !== subcategoria.nombre) {
      const categoriaFinal= categoriaId|| subcategoria.categoriaId; // si no se cambia la categoria usar la categoria actual para la validacion
      const subcategoriaconmismoNombre = await Subcategoria.findOne
      ({ where:
      { nombre,
      categoriaId: categoriaFinal 
    }
   });

      if (subcategoriaconmismoNombre) {
        return res.status(400).json({
          success: false,
          message: `Ya existe una subcategoria con el nombre "${nombre}" en esta categoria`,
        });
      }
    }

    //Aactualizar campos
    if (nombre !== undefined) subcategoria.nombre = nombre;
    if (descripcion !== undefined) subcategoria.descripcion = descripcion;
    if (categoriaId !== undefined) subcategoria.categoriaId = categoriaId;
    if (activo !== undefined) subcategoria.activo = activo;

    //Guardar cambios
    await subcategoria.save();

    //Respuesta exitosa
    res.json({
      success: true,
      message: "Subcategoria actualizada exitosamente",
      data: {
        subcategoria,
      },
    });
  } catch (error) {
    console.error("Error en actualizarSubcategoria: ", error);
    if (error.name === "sequelizeValidationError") {
      return res.status(400).json({
        success: false,
        message: "Error de validacion",
        errors: error.errors.map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar subcategoria",
      error: error.message,
    });
  }
};

/**
 * Activa/Desactivar categoria
 * PATCH /api/admin/categorias/:id/estado
 *
 * Al desactivar una categoria se desactivan todas las subcategorias relacionadas
 * Al desactivar una subcategoria se desactivan todos los productos relacionados
 * @param {Object} req request express
 * @param {Object} res response express
 */

const toggleCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    //buscar categoria
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoria no encontrada",
      });
    }

    // Alternar estado activo
    const nuevoEstado = !categoria.activo;
    categoria.activo = nuevoEstado;

    //Guardar cambios
    await categoria.save();

    // Contar cuantos registros se afectaron
    const subcategoriasAfectadas = await Subcategoria.count({
      where: { categoriaId: id },
    });

    const productosAfectados = await Producto.count({
      where: { categoriaId: id },
    });

    //Respuesta exitosa
    res.json({
      success: true,
      message: `Categoria ${nuevoEstado ? "activada" : "desactivada"} exitosamente`,
      data: {
        categoria,
        afectados: {
          subcategorias: subcategoriasAfectadas,
          productos: productosAfectados,
        },
      },
    });
  } catch (error) {
    console.error("Error en toggleCategoria: ", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar estado de categoria",
      error: error.message,
    });
  }
};

/**
 * Eliminar categoria
 * DELETE /api/admin/categorias/:id
 * Solo permite eliminar si no tiene subcategorias ni productos relacionados
 * @param {Object} req request express
 * @param {Object} res response express
 */
const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    //Buscar categoria
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoria no encontrada",
      });
    }

    // Validacion verificar que no tenga subcategorias
    const subcategorias = await Subcategoria.count({
      where: { categoriaId: id },
    });

    if (subcategorias > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoria porque tiene ${subcategorias} subcategorias asociadas usa PATCH /api/admin/categorias/:id toggle para desactivarla en lugar de eliminarla`,
      })
    }

        // Validacion verificar que no tenga productos
    const productos = await Producto.count({
      where: { categoriaId: id },
    });

    if (productos > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar la categoria porque tiene ${productos} productos asociados usa PATCH /api/admin/categorias/:id toggle para desactivarla en lugar de eliminarla`,
      });
    }

    //Eliminar categoria
    await categoria.destroy();

    //Respuesta exitosa
    res.json({
      success: true,
      message: "Categoria eliminada Exitosamente",
    });
  } catch (error) {
      console.error("Error al eliminar categoria", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar categoria",
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
 * valor total del inventario
 * stock total 
 * @param {Object} req request express
 * @param {Object} res response express
 */
const getEstadisticasCategoria = async (req, res) => {
  try {
    const { id } = req.params;

    //Verificar que la categoria exista
    const categoria = await Categoria.findByPk(id);

    if (!categoria) {
      return res.status(404).json({
        success: false,
        message: "Categoria no encontrada",
      });
    }

    // contar subcategorias
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

    // obtener productos para calcular estadisticas
    const productos = await Producto.findAll({
      where: { categoriaId: id },
      attributes: ["precio", "stock"]
    });

    // calcular estadisticas de inventario
    let valorTotalInventario = 0;
    let stockTotal = 0;

    productos.forEach(producto => {
      valorTotalInventario += parseFloat(producto.precio) * producto.stock;
      stockTotal += producto.stock;
    });

    //Respuesta exitosa
    res.json({
      success: true,
      data: {
        categoria: {
          id: categoria.id,
          nombre: categoria.nombre,
          activo: categoria.activo
        },
        estadisticas:{
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
            stockTotal: stockTotal,
            valorTotal: valorTotalInventario.toFixed(2) // quitar decimales 
        }
      }
    }
  });
} catch (error) {
      console.error("Error en getEstadisticasCategoria: ", error);
      res.status(500).json({
        success: false,
        message: "Error al obtener estadisticas",
        error: error.message
      });
    }
  };

  module.exports = {
    getCategorias,
    getCategoriasById,
    crearCategoria,
    actualizarCategoria,
    toggleCategoria,
    eliminarCategoria,
    getEstadisticasCategoria
  }