/**
 * Asociaciones entre modelos
 * este archivo define todos las relaciones entre los modelos de sequelize 
 * deje ejecutarse despues de importar los modelos
 */

//Importar todos los modelos

const Usuario = require('./Usuario');
const Categoria = require('./Categoria');
const Subcategoria = require('./Subcategoria');
const Producto = require('./Producto');
const Carrito = require('./Carrito');
const Pedido = require('./Pedido');
const DetallePedido = require('./DetallePedido');

/**
 * Definir asociaciones
 * Tipos de relaciones sequelize:
 * hasone 1 - 1
 * belongsto 1 - 1
 * hasmany 1 - N
 * belongstomany N - N
 */

/**
 * Categoria - Subcategoria
 * Una categoria tiene muchas subcategorias
 * Una subcategoria pertenece a una categoria
 */

Categoria.hasMany(Subcategoria, {
    foreignKey: 'categoriaId', //Campo que conecta las tablas
    as: 'subcategorias', //Alias para la relacion
    onDelete: 'CASCADE', //Si se elimina categoria eliminar subcategorias
    onUpdate: 'CASCADE' //Si se actualiza categoria actualizar subcategorias
});

Subcategoria.belongsTo(Categoria, {
    foreignKey: 'categoriaId', //Campo que conecta las tablas
    as: 'categoria', //Alias para la relacion
    onDelete: 'CASCADE', //Si se elimina categoria eliminar subcategorias
    onUpdate: 'CASCADE' //Si se actualiza categoria actualizar subcategorias
});

/**
 * Categoria - producto
 * Una categoria tiene muchas productos
 * Un producto pertenece a una categoria
 */

Categoria.hasMany(Producto, {
    foreignKey: 'categoriaId', //Campo que conecta las tablas
    as: 'productos', //Alias para la relacion
    onDelete: 'CASCADE', //Si se elimina categoria eliminar el producto
    onUpdate: 'CASCADE' //Si se actualiza categoria actualizar el producto
});

Producto.belongsTo(Categoria, {
    foreignKey: 'categoriaId', //Campo que conecta las tablas
    as: 'categoria', //Alias para la relacion
    onDelete: 'CASCADE', //Si se elimina categoria eliminar el producto
    onUpdate: 'CASCADE' //Si se actualiza categoria actualizar el producto
});

/**
 * Subcategoria y producto
 * Una subcategoria tiene muchos productos
 * Un producto pertenece a una subcategoria
 */

Subcategoria.hasMany(Producto, {
    foreignKey: 'subcategoriaId', //Campo que conecta las tablas
    as: 'producto', //Alias para la relacion
    onDelete: 'CASCADE', //Si se elimina subcategoria eliminar producto
    onUpdate: 'CASCADE' //Si se actualiza subcategoria actualizar producto
});

Producto.belongsTo(Subcategoria, {
    foreignKey: 'subcategoriaId', //Campo que conecta las tablas
    as: 'subcategoria', //Alias para la relacion
    onDelete: 'CASCADE', //Si se elimina subcategoria eliminar el producto
    onUpdate: 'CASCADE' //Si se actualiza subcategoria actualizar el producto
});

/**
 * Usuario - carrito
 * Un usuario tiene muchos carritos
 * Un carrito pertenece a un usuario
 */

Usuario.hasMany(Carrito, {
    foreignKey: 'usuarioId', //Campo que conecta las tablas
    as: 'carrito', //Alias para la relacion
    onDelete: 'CASCADE', //Si se elimina usuario eliminar el carrito
    onUpdate: 'CASCADE' //Si se actualiza usuario actualizar el carrito
});

Carrito.belongsTo(Usuario, {
    foreignKey: 'usuarioId', //Campo que conecta las tablas
    as: 'usuario', //Alias para la relacion
    onDelete: 'CASCADE', //Si se elimina usuario eliminar el carrito
    onUpdate: 'CASCADE' //Si se actualiza usuario actualizar el carrito
});

/**
 * Producto - carrito
 * Un producto tiene muchos carritos
 * Un carrito pertenece a un producto
 */

Producto.hasMany(Carrito, {
    foreignKey: 'productoId', //Campo que conecta las tablas
    as: 'carrito', //Alias para la relacion
    onDelete: 'CASCADE', //Si se elimina producto eliminar el carrito
    onUpdate: 'CASCADE' //Si se actualiza producto actualizar el carrito
});

Carrito.belongsTo(Producto, {
    foreignKey: 'productoid', //Campo que conecta las tablas
    as: 'producto', //Alias para la relacion
    onDelete: 'CASCADE', //Si se elimina producto eliminar el carrito
    onUpdate: 'CASCADE' //Si se actualiza producto actualizar el carrito
});

/**
 * Usuario - Pedido
 * Un usuario tiene muchos pedido
 * Un pedido pertenece a un usuario
 */

Usuario.hasMany(Pedido, {
    foreignKey: 'usuarioId', //Campo que conecta las tablas
    as: 'pedido', //Alias para la relacion
    onDelete: 'RESTRICT', //Si se elimina Usuario NO eliminar el Pedido
    onUpdate: 'CASCADE' //Si se actualiza Usuario actualizar el Pedido
});

Pedido.belongsTo(Usuario, {
    foreignKey: 'usuarioid', //Campo que conecta las tablas
    as: 'usuario', //Alias para la relacion
    onDelete: 'RESTRICT', //Si se elimina Usuario NO eliminar el Pedido
    onUpdate: 'CASCADE' //Si se actualiza Usuario actualizar el Pedido
});

/**
 * Pedido - DetallePedido
 * Un pedido tiene muchos detalles de pedido
 * Un detalle de pedido pertenece a un pedido
 */

Pedido.hasMany(DetallePedido, {
    foreignKey: 'pedidoId', //Campo que conecta las tablas
    as: 'detalles', //Alias para la relacion
    onDelete: 'CASCADE', //Si se elimina Pedido eliminar el detalles del pedido
    onUpdate: 'CASCADE' //Si se actualiza Pedido actualizar el detalles del pedido
});

DetallePedido.belongsTo(Pedido, {
    foreignKey: 'pedidoid', //Campo que conecta las tablas
    as: 'pedido', //Alias para la relacion
    onDelete: 'CASCADE', //Si se elimina Pedido eliminar el detalle del pedido
    onUpdate: 'CASCADE' //Si se actualiza Pedido actualizar el detalle del pedido
});

/**
 * Producto - DetallePedido
 * Un producto puede estar en muchos detalles de pedido
 * Un detalle de pedido tiene a un producto
 */

Producto.hasMany(DetallePedido, {
    foreignKey: 'productoId', //Campo que conecta las tablas
    as: 'detallesPedidos', //Alias para la relacion
    onDelete: 'RESTRICT', //No se puede eliminar un producto si esta en un detalle de pedido
    onUpdate: 'CASCADE' //Si se actualiza Producto actualizar el detalles del pedido
});

DetallePedido.belongsTo(Producto, {
    foreignKey: 'productoid', //Campo que conecta las tablas
    as: 'producto', //Alias para la relacion
    onDelete: 'RESTRICT', //No se puede eliminar un producto si esta en un detalle de pedido
    onUpdate: 'CASCADE' //Si se actualiza Producto actualizar el detalles del pedido
});

/**
 * relacion de muchos a muchos
 * pedido y producto tiene una relacion de muchos a muchos atravez de detalle pedido
 */

Pedido.hasMany(Producto, {
    through: DetallePedido, //tabla intermedia
    foreignKey: 'pedidoId', //Campo que conecta las tablas
    otherKey: 'productoId', //Campo que conecta las tablas
    as: 'productos', //Alias para la relacion
});

Producto.hasMany(Pedido, {
    through: DetallePedido, //tabla intermedia
    foreignKey: 'productoId', //Campo que conecta las tablas
    otherKey: 'pedidoId', //Campo que conecta las tablas
    as: 'pedidos', //Alias para la relacion
});

/**
 * Exportar funcion de inicializacion
 * funcioin para inicializar todas las asociaciones 
 * se llama despues server.js despues de cargar los modelos
 */
const initAssociations = () => {
    console.log('Asociaciones entre los modelos establecidas correctamente');
}

//Exportar los modelos
module.exports = {
    Usuario,
    Categoria,
    Subcategoria,
    Producto,
    Carrito,
    Pedido,
    DetallePedido,
    initAssociations
};