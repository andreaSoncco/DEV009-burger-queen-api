const { ObjectId } = require('mongodb');
const { connect } = require('../connect.js');

const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');

/** @module products */
module.exports = (app, nextMain) => {
  /**
   * @name GET /products
   * @description Lista productos
   * @path {GET} /products
   * @query {String} [page=1] Página del listado a consultar
   * @query {String} [limit=10] Cantitad de elementos por página
   * @header {Object} link Parámetros de paginación
   * @header {String} link.first Link a la primera página
   * @header {String} link.prev Link a la página anterior
   * @header {String} link.next Link a la página siguiente
   * @header {String} link.last Link a la última página
   * @auth Requiere `token` de autenticación
   * @response {Array} products
   * @response {String} products[]._id Id
   * @response {String} products[].name Nombre
   * @response {Number} products[].price Precio
   * @response {URL} products[].image URL a la imagen
   * @response {String} products[].type Tipo/Categoría
   * @response {Date} products[].dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   */
  app.get('/products', requireAuth, async(req, resp, next) => {
      try {
        const { client, db } = await connect();
  
        const Products = db.collection('Products');
  
        // Buscar todos los usuarios en la colección
        const products = await Products.find({}).toArray();
        await client.close();
  
        resp.json(products); // Enviar la lista de usuarios como respuesta
      } catch (error) {
        next(error);
      }
  });

  /**
   * @name GET /products/:productId
   * @description Obtiene los datos de un producto especifico
   * @path {GET} /products/:productId
   * @params {String} :productId `id` del producto
   * @auth Requiere `token` de autenticación
   * @response {Object} product
   * @response {String} product._id Id
   * @response {String} product.name Nombre
   * @response {Number} product.price Precio
   * @response {URL} product.image URL a la imagen
   * @response {String} product.type Tipo/Categoría
   * @response {Date} product.dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {404} si el producto con `productId` indicado no existe
   */
  app.get('/products/:productId', requireAuth, async(req, resp, next) => {
    try {
      const { client, db } = await connect();
      const Products = db.collection('Products');
  
      let requestedProduct;
      if (ObjectId.isValid(req.params.productId)) {
        requestedProduct = await Products.findOne({ _id: new ObjectId(req.params.productId) });
      } else {
        requestedProduct = await Products.findOne({ name: req.params.productId });
      }
  
      if (!requestedProduct) {
        return resp.status(404).json({ message: "Producto no encontrado" });
      }
  
      resp.json(requestedProduct);
      await client.close();
    } catch (error) {
      next(error);
    }
  });

  /**
   * @name POST /products
   * @description Crea un nuevo producto
   * @path {POST} /products
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin**
   * @body {String} name Nombre
   * @body {Number} price Precio
   * @body {String} [imagen]  URL a la imagen
   * @body {String} [type] Tipo/Categoría
   * @response {Object} product
   * @response {String} products._id Id
   * @response {String} product.name Nombre
   * @response {Number} product.price Precio
   * @response {URL} product.image URL a la imagen
   * @response {String} product.type Tipo/Categoría
   * @response {Date} product.dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {400} si no se indican `name` o `price`
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es admin
   * @code {404} si el producto con `productId` indicado no existe
   */
  app.post('/products', requireAuth, requireAdmin, async(req, resp, next) => {
    try {
      const { id, name, price, image, type } = req.body;

      // Verificar que se proporcionen nombre del producto y precio
      if (!name || !price) {
        return resp.status(400).json({ message: 'Se requieren nombre y precio para crear un producto.' });
      };

      let fechaHoraActual = new Date();
      let fechaHoraFormateada = fechaHoraActual.toLocaleString('es-ES', { timeZone: 'UTC' });

      const newProduct = {
        id: id,
        name: name,
        price: price,
        image: image,
        type: type,
        dateEntry: fechaHoraFormateada 
      };
  
      const { client, db } = await connect();
      const productsCollection = db.collection('Products');
  
      // Verificar si el producto ya existe en la base de datos
      const existingProduct = await productsCollection.findOne({ name });
  
      if (existingProduct) {
        return resp.status(403).json({ message: 'El producto ya existe en la base de datos.' });
      }
  
      // Si el producto no existe, crear un nuevo producto
      const result = await productsCollection.insertOne(newProduct);

      if (result.acknowledged) {
        resp.status(200).json({ newProduct });
      } else {
        resp.status(500).json({ message: 'No se pudo crear el producto.' });
      }
        
      await client.close();
    } catch (error) {
      next(error);
    }
  });

  /**
   * @name PUT /products
   * @description Modifica un producto
   * @path {PUT} /products
   * @params {String} :productId `id` del producto
   * @auth Requiere `token` de autenticación y que el usuario sea **admin**
   * @body {String} [name] Nombre
   * @body {Number} [price] Precio
   * @body {String} [imagen]  URL a la imagen
   * @body {String} [type] Tipo/Categoría
   * @response {Object} product
   * @response {String} product._id Id
   * @response {String} product.name Nombre
   * @response {Number} product.price Precio
   * @response {URL} product.image URL a la imagen
   * @response {String} product.type Tipo/Categoría
   * @response {Date} product.dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {400} si no se indican ninguna propiedad a modificar
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es admin
   * @code {404} si el producto con `productId` indicado no existe
   */
  app.put('/products/:productId', requireAuth, requireAdmin, async(req, resp, next) => {
    try {
      const { id, name, price, image, type } = req.body;

      if (typeof price !== 'number' || !Number.isInteger(price)) {
        return resp.status(400).json({ message: 'El precio debe ser un número entero.' });
      };     

      const { client, db } = await connect();
      const Products = db.collection('Products');
      const productId = req.params.productId;
  
      let requestedProduct;
      if (ObjectId.isValid(productId)) {
        requestedProduct = await Products.findOne({ _id: new ObjectId(productId) });
      } else {
        requestedProduct = await Products.findOne({ name: productId });
      }
  
      if (!requestedProduct) {
        return resp.status(404).json({ message: "Producto no encontrado" });
      }

      if (Object.keys(req.body).length === 0) {
        return resp.status(400).json({ message: "No se proporcionaron accesorios para actualizar" });
      }
  
      if ( !id || !name || !price || !image || !type ) {
        return resp.status(400).json({ message: "Se requiere el id, nombre o alguna propiedad para actualizar" });
      }

      const updatedProduct = await Products.findOneAndUpdate(
        { _id: requestedProduct._id },
        { $set: { id, name, price, image, type } },
        { returnDocument: 'after' }
      );
  
      if (!updatedProduct.value) {
        return resp.status(404).json({ message: "El producto solicitado no existe" });
      }
      resp.status(200).json(updatedProduct.value);
      await client.close();
    } catch (error) {
      next(error);
    }
  });

  /**
   * @name DELETE /products
   * @description Elimina un producto
   * @path {DELETE} /products
   * @params {String} :productId `id` del producto
   * @auth Requiere `token` de autenticación y que el usuario sea **admin**
   * @response {Object} product
   * @response {String} product._id Id
   * @response {String} product.name Nombre
   * @response {Number} product.price Precio
   * @response {URL} product.image URL a la imagen
   * @response {String} product.type Tipo/Categoría
   * @response {Date} product.dateEntry Fecha de creación
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin
   * @code {404} si el producto con `productId` indicado no existe
   */
  app.delete('/products/:productId', requireAuth, requireAdmin, async(req, resp, next) => {
    try {
      const { client, db } = await connect();
      const Products = db.collection('Products');
        
      let requestedProduct;
      if (ObjectId.isValid(req.params.productId)) {
        requestedProduct = await Products.findOne({ _id: new ObjectId(req.params.productId) });
      } else {
        requestedProduct = await Products.findOne({ name: req.params.productId });
      }
      
      if (!requestedProduct) {
        return resp.status(404).json({ message: "Producto no encontrado" }); // El error esta aquí
      }
      
      const deletedProduct = await Products.deleteOne({ _id: requestedProduct._id }, { name: requestedProduct.name });
      
      if (deletedProduct.deletedCount === 0) {
        return resp.status(404).json({ message: "El producto solicitado no existe" });
      }
      
      resp.status(200).json({ message: "Producto eliminado correctamente" });
      await client.close();
    } catch (error) {
      next(error);
    }

  });

  nextMain();
};
