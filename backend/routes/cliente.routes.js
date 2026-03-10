/** Rutas del cliente
 * rutas publicas para l¿clientes
 */

const express =  require('express');
const router = express.Router();

//Importar los middlewares
const { verificarAuth } = require('../middleware/auth');
const { esCliente} = require('../middleware/checkRole');


//importar controladores
const catalogoController = require('../controllers/catalogo.controller');
const carritoController = require('../controllers/carrito.controller');
const pedidoController = require('../controllers/pedido.controller');


//********************************************************************************************
// CATALOGO */

//rutas de publicas catalogo
//get /api/admin/catalogo/productos
router.get('/catalogo/productos', catalogoController.getProductos);

//get /api/catalogo/productos/:id
router.get('/catalogo/productos/:id', catalogoController.getproductoById);

//get /api/admin/catalogo/categorias
router.get('/catalogo/categorias', catalogoController.getCategorias);

//get /api/catalogo/categoria/:id/subcategorias
router.get('/catalogo/categorias/:id/subcategorias', catalogoController.getSubcategoriasPorCategoria);

//get /api/catalogo/destacados
router.get('/catalogo/destacados', catalogoController.getProductosDestacados);


//***********************************************************************************************
// CARRITO */

//Rutas del carrito
// get /api/cliente/carrito
router.get('/cliente/carrito', carritoController.getCarrito);

// POST /api/cliente/carrito
router.post('/cliente/carrito', carritoController.agregarAlCarrito);

// PUT /api/cliente/carrito/:id
router.put('/cliente/carrito/:id', verificarAuth, carritoController.actualiItemcarrito);

// delete /api/cliente/carrito/:id
router.delete('/cliente/carrito/:id', verificarAuth, carritoController.eliminarItemCarrito);

// delete /api/cliente/carrito/:id
//vaciar carrito
router.delete('/cliente/carrito/:id', verificarAuth, carritoController.vaciarCarrito);



//***********************************************************************************************
// PEDIDO-CLIENTE */

//rutas de p-cliente
//POST /api/admin/productos
router.post('/cliente/pedidos', verificarAuth, pedidoController.crearPedido);

//get /api/cliente/pedidos/:id
router.get('/cliente/pedidos', verificarAuth, pedidoController.getMisPedidos);

//get /api/cliente/pedidos/:id
router.get('/cliente/pedidos/:id', verificarAuth, pedidoController.getPedidoById);

//PUT /api/cliente/pedidos/:id/cancelar
router.put('/cliente/pedidos/:id/cancelar', verificarAuth, pedidoController.cancelarPedido);

module.exports = router;