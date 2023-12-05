const { ObjectId } = require('mongodb');
const { connect } = require('../connect.js');

const {
  requireAuth,
} = require('../middleware/auth');

/** @module orders */
module.exports = (app, nextMain) => {
  /**
   * @name GET /orders
   * @description Lista órdenes
   * @path {GET} /orders
   * @query {String} [page=1] Página del listado a consultar
   * @query {String} [limit=10] Cantitad de elementos por página
   * @header {Object} link Parámetros de paginación
   * @header {String} link.first Link a la primera página
   * @header {String} link.prev Link a la página anterior
   * @header {String} link.next Link a la página siguiente
   * @header {String} link.last Link a la última página
   * @auth Requiere `token` de autenticación
   * @response {Array} orders
   * @response {String} orders[]._id Id
   * @response {String} orders[].userId Id usuaria que creó la orden
   * @response {String} orders[].Client Clienta para quien se creó la orden
   * @response {Array} orders[].products Productos
   * @response {Object} orders[].products[] Producto
   * @response {Number} orders[].products[].qty Cantidad
   * @response {Object} orders[].products[].product Producto
   * @response {String} orders[].status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} orders[].dateEntry Fecha de creación
   * @response {Date} [orders[].dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   */
  app.get('/orders', requireAuth, async(req, resp, next) => {
    try {
      const { Client, db } = await connect();
      const Orders = db.collection('Orders');

      // Buscar todas las ordenes en la colección
      const orders = await Orders.find({}).toArray();
      await Client.close();

      resp.json(orders); // Enviar la lista de ordenes como respuesta
    } catch (error) {
      next(error);
    }
  });

  /**
   * @name GET /orders/:orderId
   * @description Obtiene los datos de una orden especifico
   * @path {GET} /orders/:orderId
   * @params {String} :orderId `id` de la orden a consultar
   * @auth Requiere `token` de autenticación
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {String} order.Client Clienta para quien se creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si la orden con `orderId` indicado no existe
   */
  app.get('/orders/:orderId', requireAuth, async(req, resp, next) => {
    try {
      const { Client, db } = await connect();
      const Orders = db.collection('Orders');
      const orderId = req.params.orderId;
  
      let requestedOrder;
      if (ObjectId.isValid(orderId)) {
        requestedOrder = await Orders.findOne({ _id: new ObjectId(orderId) });
      } else {
        requestedOrder = await Orders.findOne({ id: orderId });
      }
  
      if (!requestedOrder) {
        return resp.status(404).json({ message: "Orden no encontrada" });
      }
  
      resp.json(requestedOrder);
      await Client.close();
    } catch (error) {
      next(error);
    }
  });

  /**
   * @name POST /orders
   * @description Crea una nueva orden
   * @path {POST} /orders
   * @auth Requiere `token` de autenticación
   * @body {String} userId Id usuaria que creó la orden
   * @body {String} Client Clienta para quien se creó la orden
   * @body {Array} products Productos
   * @body {Object} products[] Producto
   * @body {String} products[].productId Id de un producto
   * @body {Number} products[].qty Cantidad de ese producto en la orden
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {String} order.Client Clienta para quien se creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {400} no se indica `userId` o se intenta crear una orden sin productos
   * @code {401} si no hay cabecera de autenticación
   */
  app.post('/orders', requireAuth, async(req, resp, next) => {
    try {
      const { userId, client, products } = req.body;

      // Verificar que se proporcionen nombre del producto y precio
      if (!userId || !client || !products) {
        return resp.status(400).json({ message: 'Se requiere el nombre del usuario que registra la orden, nombre del cliente y la lista de productos.' });
      };

      let fechaHoraActual = new Date();
      let fechaHoraFormateada = fechaHoraActual.toLocaleString('es-ES', { timeZone: 'UTC' });

      const newOrder = {
        userId: userId, 
        client: client,
        products: products,
        status: 'pending',
        dateEntry: fechaHoraFormateada 
      };
  
      const { Client, db } = await connect();
      const ordersCollection = db.collection('Orders');
    
      // Si el producto no existe, crear un nuevo producto
      const result = await ordersCollection.insertOne(newOrder);

      if (result.acknowledged) {
        resp.status(200).json( newOrder );
      } else {
        resp.status(500).json({ message: 'No se pudo crear la orden.' });
      }
        
      await Client.close();
    } catch (error) {
      next(error);
    }
  });

  /**
   * @name PUT /orders
   * @description Modifica una orden
   * @path {PUT} /products
   * @params {String} :orderId `id` de la orden
   * @auth Requiere `token` de autenticación
   * @body {String} [userId] Id usuaria que creó la orden
   * @body {String} [Client] Clienta para quien se creó la orden
   * @body {Array} [products] Productos
   * @body {Object} products[] Producto
   * @body {String} products[].productId Id de un producto
   * @body {Number} products[].qty Cantidad de ese producto en la orden
   * @body {String} [status] Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {400} si no se indican ninguna propiedad a modificar o la propiedad `status` no es valida
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si la orderId con `orderId` indicado no existe
   */
  app.put('/orders/:orderId', requireAuth, async(req, resp, next) => {
    try {

      const { Client, db } = await connect();
      const Orders = db.collection('Orders');
      const orderId = req.params.orderId;
  
      let requestedOrder;
      if (ObjectId.isValid(orderId)) {
        requestedOrder = await Orders.findOne({ _id: new ObjectId(orderId) });
      } 

      if (!requestedOrder) {
        return resp.status(404).json({ message: "Orden no encontrada" });
      }

      const { userId, client, products, status } = req.body;

      const allowedStatus = ['pending', 'preparing', 'canceled', 'delivering', 'delivered'];

      if (!allowedStatus.includes(status)) {
        return resp.status(400).json({ message: "Incorrecto Estado de la Orden" });
      }
      
      if (Object.keys(req.body).length === 0) {
        return resp.status(400).json({ message: "No se proporcionaron accesorios para actualizar la orden" });
      }

      let fechaHoraActual = new Date();
      let fechaHoraFormateada = fechaHoraActual.toLocaleString('es-ES', { timeZone: 'UTC' });

      const updateFields = {
        userId,
        client,
        products,
        status,
      };
  
      if (status === 'delivered') {
        updateFields.dateProcessed = fechaHoraFormateada;
      }
  
      const updatedOrder = await Orders.findOneAndUpdate(
        { _id: requestedOrder._id },
        { $set: updateFields },
        { returnDocument: 'after' }
      );
 
      if (!updatedOrder.value) {
        return resp.status(404).json({ message: "La orden a cambiar no existe" });
      }
      resp.status(200).json(updatedOrder.value);
      await Client.close();
    } catch (error) {
      next(error);
    }
  });

  /**
   * @name DELETE /orders
   * @description Elimina una orden
   * @path {DELETE} /orders
   * @params {String} :orderId `id` del producto
   * @auth Requiere `token` de autenticación
   * @response {Object} order
   * @response {String} order._id Id
   * @response {String} order.userId Id usuaria que creó la orden
   * @response {String} order.Client Clienta para quien se creó la orden
   * @response {Array} order.products Productos
   * @response {Object} order.products[] Producto
   * @response {Number} order.products[].qty Cantidad
   * @response {Object} order.products[].product Producto
   * @response {String} order.status Estado: `pending`, `canceled`, `delivering` o `delivered`
   * @response {Date} order.dateEntry Fecha de creación
   * @response {Date} [order.dateProcessed] Fecha de cambio de `status` a `delivered`
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si el producto con `orderId` indicado no existe
   */
  app.delete('/orders/:orderId', requireAuth, async(req, resp, next) => {
    try {
      const { Client, db } = await connect();
      const Orders = db.collection('Orders');
      const orderId = req.params.orderId;
        
      let requestedOrder;
      if (ObjectId.isValid(orderId)) {
        requestedOrder = await Orders.findOne({ _id: new ObjectId(orderId) });
      }
      
      if (!requestedOrder) {
        return resp.status(404).json({ message: "Orden no encontrada" });
      }
      
      const deletedOrder = await Orders.deleteOne({ _id: requestedOrder._id });
      
      if (deletedOrder.deletedCount === 0) {
        return resp.status(404).json({ message: "La orden a borrar no existe" });
      }
      
      resp.status(200).json({ message: "Orden eliminada correctamente" });
      await Client.close();
    } catch (error) {
      next(error);
    }

  });

  nextMain();
};
