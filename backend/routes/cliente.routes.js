/** Rutas del cliente
 * rutas publicas para l¿clientes
 */

const express =  require('express');
const router = express.Router();

//Importar los middlewares
const { verificarAuth } = require('../middleware/auth');
const { esCliente} = require('../middleware/checkRole');


//importar controladores
const carritoController = require('../controllers/carrito.controller');
const pedidoController = require('../controllers/pedido.controller');

// CARRITO
//Rutas del carrito
// get /api/cliente/carrito
router.get('/carrito', verificarAuth, esCliente, carritoController.getCarrito);

// POST /api/cliente/carrito
router.post('/carrito', verificarAuth, esCliente, carritoController.agregarAlCarrito);

// PUT /api/cliente/carrito/:id
router.put('/carrito/:id', verificarAuth, esCliente, carritoController.actualizarItemCarrito);

// delete /api/cliente/carrito/:id
router.delete('/carrito/:id', verificarAuth, esCliente, carritoController.eliminarItemCarrito);

// delete /api/cliente/carrito
//vaciar carrito
router.delete('/carrito', verificarAuth, esCliente, carritoController.vaciarCarrito);

// PEDIDO-CLIENTE 
//rutas de p-cliente
//POST /api/admin/productos
router.post('/pedidos', verificarAuth, esCliente, pedidoController.crearPedido);

//get /api/cliente/pedidos/:id
router.get('/pedidos', verificarAuth, esCliente, pedidoController.getMisPedidos);

//get /api/cliente/pedidos/:id
router.get('/pedidos/:id', verificarAuth, esCliente, pedidoController.getPedidoById);

//PUT /api/cliente/pedidos/:id/cancelar
router.put('/pedidos/:id/cancelar', verificarAuth, esCliente, pedidoController.cancelarPedido);

module.exports = router;