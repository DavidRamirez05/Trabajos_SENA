/** Rutas del administrador
 * agrupa todas las urutas de gestion del admin
 */

const express =  require('express');
const router = express.Router();

//Importar los middlewares
const { verificarAuth } = require('../middleware/auth');
const { esAdministrador, esAdminOAuxiliar, soloAdministrador } = require('../middleware/checkRole');

//Importar configuracion de multer para la subida de imagenes
const { upload } = require('../config/multer');

//importar controladores
const categoriaController = require('../controllers/categoria.controller');
const subcategoriaController = require('../controllers/subcategoria.controller');
const productoController = require('../controllers/producto.controller');
const usuarioController = require('../controllers/usuario.controller');
const pedidoController = require('../controllers/pedido.controller');

// restricciones de acceso a las rutas del admin
router.use(verificarAuth, esAdminOAuxiliar);
//********************************************************************************************
// CATEGORIAS */

//rutas de categorias
//get /api/admin/categorias
router.get('/categorias', categoriaController.getCategorias);

//get /api/admin/categoria:id
router.get('/categorias/:id', categoriaController.getCategoriaById);

//get /api/admin/categorias/:id/stats
router.get('/categorias:id/stats', categoriaController.getEstadisticasCategoria);

//POST /api/admin/categorias
router.post('/categorias', categoriaController.crearCategoria);

//PUT /api/admin/categorias
router.put('/categorias', categoriaController.actualizarCategoria);

//patch /api/admin/categorias:id/toggle desactivar o activar categoria
router.patch('/categorias/:id/toggle', categoriaController.toggleCategoria);

//delete /api/admin/categorias
router.post('/categorias/:id', soloAdministrador, categoriaController.eliminarCategoria);

//***********************************************************************************************
// SUBCATEGORIAS */

//rutas de subcategorias
//get /api/admin/subcategorias
router.get('/subcategorias', subcategoriaController.getSubcategorias);

//get /api/admin/subcategorias:id
router.get('/subcategorias/:id', subcategoriaController.getSubcategoriaById);

//get /api/admin/subcategorias/:id/stats
router.get('/subcategorias:id/stats', subcategoriaController.getEstadisticasSubcategoria);

//POST /api/admin/subcategorias
router.post('/subcategorias', subcategoriaController.crearSubcategoria);

//PUT /api/admin/subcategorias
router.put('/subcategorias', subcategoriaController.actualizarSubcategoria);

//patch /api/admin/subcategorias:id/toggle desactivar o activar categoria
router.patch('/subcategorias/:id/toggle', subcategoriaController.toggleSubcategoria);

//delete /api/admin/subcategorias
router.post('/subcategorias/:id', soloAdministrador, subcategoriaController.eliminarSubcategoria);

//***********************************************************************************************
// PRODUCTOS */

//rutas de productos
//get /api/admin/productos
router.get('/productos', productoController.getProductos);

//get /api/admin/productos:id
router.get('/productos/:id', productoController.getproductoById);

//POST /api/admin/productos
router.post('/productos', productoController.crearProducto);

//PUT /api/admin/productos
router.put('/productos', productoController.actualizarProducto);

//patch /api/admin/productos:id/toggle desactivar o activar categoria
router.patch('/productos/:id/toggle', productoController.toggleproducto);

//delete /api/admin/productos
router.post('/productos/:id', soloAdministrador, productoController.eliminarProducto);

//*****************************************************************************************************
// USUARIOS */

//rutas de usuarios
//get /api/admin/usuarios
router.get('/usuarios', usuarioController.getUsuarios);

//get /api/admin/usuarios:id
router.get('/usuarios/:id', usuarioController.getUsuarioById);

//get /api/admin/usuarios/:id/stats
router.get('/usuarios:id/stats', usuarioController.getEstadisticasUsuarios);

//POST /api/admin/usuarios
router.post('/usuarios', usuarioController.crearUsuario);

//PUT /api/admin/usuarios
router.put('/usuarios', usuarioController.actualizarUsuario);

//patch /api/admin/usuarios:id/toggle desactivar o activar categoria
router.patch('/usuarios/:id/toggle', usuarioController.toggleUsuario);

//delete /api/admin/usuarios
router.post('/usuarios/:id', soloAdministrador, usuarioController.eliminarUsuario);

//******************************************************************************************************
// PEDIDOS */

//rutas de pedidos
//get /api/admin/subcategorias
router.get('/subcategorias', subcategoriaController.getSubcategorias);

//get /api/admin/subcategorias:id
router.get('/subcategorias/:id', subcategoriaController.getSubcategoriaById);

//get /api/admin/subcategorias/:id/stats
router.get('/subcategorias:id/stats', subcategoriaController.getEstadisticasSubcategoria);

//POST /api/admin/subcategorias
router.post('/subcategorias', subcategoriaController.crearSubcategoria);

//PUT /api/admin/subcategorias
router.put('/subcategorias', subcategoriaController.actualizarSubcategoria);

//patch /api/admin/subcategorias:id/toggle desactivar o activar categoria
router.patch('/subcategorias/:id/toggle', subcategoriaController.toggleSubcategoria);

//delete /api/admin/subcategorias
router.post('/subcategorias/:id', soloAdministrador, subcategoriaController.eliminarSubcategoria);