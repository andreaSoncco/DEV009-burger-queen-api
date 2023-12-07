const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { connect } = require('../connect.js');

const {
  requireAuth,
  requireAdmin,
} = require('../middleware/auth');

const {
  getUsers,
} = require('../controller/users');

const initAdminUser = async (app, next) => {
  const { id, adminEmail, adminPassword } = app.get('config');
  
  if (!id || !adminEmail || !adminPassword) {
    return next();
  }

  const adminUser = {
    id: id,
    email: adminEmail,
    password: bcrypt.hashSync(adminPassword, 10),
    roles: { admin: true },
  };

  try {
    const { Client, db } = await connect();
    const usersCollection = db.collection('Users');

    const existingAdminUser = await usersCollection.findOne({ email: adminEmail });

    if (!existingAdminUser) {
      await usersCollection.insertOne(adminUser);
      console.log('Usuario administrador creado con éxito.');
    } else {
      console.log('El usuario administrador ya existe en la base de datos.');
    }

    await Client.close();
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }

  next();
};

/*
 * Diagrama de flujo de una aplicación y petición en node - express :
 *
 * request  -> middleware1 -> middleware2 -> route
 *                                             |
 * response <- middleware4 <- middleware3   <---
 *
 * la gracia es que la petición va pasando por cada una de las funciones
 * intermedias o "middlewares" hasta llegar a la función de la ruta, luego esa
 * función genera la respuesta y esta pasa nuevamente por otras funciones
 * intermedias hasta responder finalmente a la usuaria.
 *
 * Un ejemplo de middleware podría ser una función que verifique que una usuaria
 * está realmente registrado en la aplicación y que tiene permisos para usar la
 * ruta. O también un middleware de traducción, que cambie la respuesta
 * dependiendo del idioma de la usuaria.
 *
 * Es por lo anterior que siempre veremos los argumentos request, response y
 * next en nuestros middlewares y rutas. Cada una de estas funciones tendrá
 * la oportunidad de acceder a la consulta (request) y hacerse cargo de enviar
 * una respuesta (rompiendo la cadena), o delegar la consulta a la siguiente
 * función en la cadena (invocando next). De esta forma, la petición (request)
 * va pasando a través de las funciones, así como también la respuesta
 * (response).
 */

/** @module users */
module.exports = (app, next) => {

  /**
   * @name GET /users
   * @description Lista usuarias
   * @path {GET} /users
   * @query {String} [page=1] Página del listado a consultar
   * @query {String} [limit=10] Cantitad de elementos por página
   * @header {Object} link Parámetros de paginación
   * @header {String} link.first Link a la primera página
   * @header {String} link.prev Link a la página anterior
   * @header {String} link.next Link a la página siguiente
   * @header {String} link.last Link a la última página
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin**
   * @response {Array} users
   * @response {String} users[]._id
   * @response {Object} users[].email
   * @response {Object} users[].roles
   * @response {Boolean} users[].roles.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin
   */
  
  app.get('/users', requireAuth, requireAdmin, async (req, resp, next) => {
    try {
      const users = await getUsers(req, resp, next);
      resp.json(users);
      
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * @name GET /users/:uid
   * @description Obtiene información de una usuaria
   * @path {GET} /users/:uid
   * @params {String} :uid `id` o `email` de la usuaria a consultar
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin** o la usuaria a consultar
   * @response {Object} user
   * @response {String} user._id
   * @response {Object} user.email
   * @response {Object} user.roles
   * @response {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {404} si la usuaria solicitada no existe
   */
  
  app.get('/users/:uid', requireAuth, requireAdmin, async (req, resp, next) => {
    try {
      const { Client, db } = await connect();
      const Users = db.collection('Users');
  
      let requestedUser;
      if (ObjectId.isValid(req.params.uid)) {
        requestedUser = await Users.findOne({ _id: new ObjectId(req.params.uid) });
      } else {
        requestedUser = await Users.findOne({ email: req.params.uid });
      }
  
      if (!requestedUser) {
        return resp.status(404).json({ message: "Usuaria no encontrada" });
      }
  
      resp.json(requestedUser);
      await Client.close();
    } catch (error) {
      next(error);
    }
  });
  
  /**
   * @name POST /users
   * @description Crea una usuaria
   * @path {POST} /users
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @body {Object} [roles]
   * @body {Boolean} [roles.admin]
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin**
   * @response {Object} user
   * @response {String} user._id
   * @response {Object} user.email
   * @response {Object} user.roles
   * @response {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si ya existe usuaria con ese `email`
   */

  app.post('/users', async (req, resp, next) => {
    try {
      const { id, email, password, roles } = req.body;

      let validEmail =  /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;

      if ((typeof password !== 'string') || (!/\d/.test(password)) || (password.length < 9)) {
        return resp.status(400).json({ message: 'La contraseña debe contener minimo 8 caracteres y al menos un número.' });
      }

	    if( !validEmail.test(email) ){
        return resp.status(400).json({ message: 'Se requieren email valido.' });
      }
  
      // Verificar que se proporcionen email y password
      if (!email || !password) {
        return resp.status(400).json({ message: 'Se requieren email y password para crear un usuario.' });
      }
  
      // Hash del password con bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = {
        id: id,
        email,
        password: hashedPassword,
        roles: roles
      };
  
      const { Client, db } = await connect();
      const usersCollection = db.collection('Users');
  
      // Verificar si el usuario ya existe en la base de datos
      const existingUser = await usersCollection.findOne({ email });
  
      if (existingUser) {
        return resp.status(403).json({ message: 'El usuario ya existe en la base de datos.' });
      }
  
      // Si el usuario no existe, crear un nuevo usuario
      const result = await usersCollection.insertOne(newUser);

      if (result.acknowledged) {
        resp.status(200).json( newUser );
      } else {
        resp.status(500).json({ message: 'No se pudo crear el usuario.' });
      }
      
  
      await Client.close();
    } catch (error) {
      next(error);
    }
  });

  /**
   * @name PUT /users
   * @description Modifica una usuaria
   * @params {String} :uid `id` o `email` de la usuaria a modificar
   * @path {PUT} /users
   * @body {String} email Correo
   * @body {String} password Contraseña
   * @body {Object} [roles]
   * @body {Boolean} [roles.admin]
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin** o la usuaria a modificar
   * @response {Object} user
   * @response {String} user._id
   * @response {Object} user.email
   * @response {Object} user.roles
   * @response {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {400} si no se proveen `email` o `password` o ninguno de los dos
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {403} una usuaria no admin intenta de modificar sus `roles`
   * @code {404} si la usuaria solicitada no existe
   */

  app.put('/users/:uid', requireAuth, requireAdmin, async (req, resp, next) => {
    try {
      const { Client, db } = await connect();
      const Users = db.collection('Users');
      const uid = req.params.uid;
  
      let requestedUser;
      if (ObjectId.isValid(uid)) {
        requestedUser = await Users.findOne({ _id: new ObjectId(uid) });
      } else {
        requestedUser = await Users.findOne({ email: uid });
      }
  
      if (!requestedUser) {
        return resp.status(404).json({ message: "Usuaria no encontrada" });
      }
  
      const { email, password, roles } = req.body;

      if (Object.keys(req.body).length === 0) {
        return resp.status(400).json({ message: "No se proporcionaron accesorios para actualizar" });
      }
  
      if (!email || !password) {
        return resp.status(400).json({ message: "Se requieren 'email' y 'password'" });
      }
     
      const passwordSecond = bcrypt.hashSync(password, 10);

      const updatedUser = await Users.findOneAndUpdate(
        { _id: requestedUser._id },
        { $set: { email, password: passwordSecond, roles } },
        { returnDocument: 'after' }
      );
  
      if (!updatedUser.value) {
        return resp.status(404).json({ message: "La usuaria solicitada no existe" });
      }
      resp.status(200).json(updatedUser.value);
      await Client.close();
    } catch (error) {
      next(error);
    }
  });

  /**
   * @name DELETE /users
   * @description Elimina una usuaria
   * @params {String} :uid `id` o `email` de la usuaria a modificar
   * @path {DELETE} /users
   * @auth Requiere `token` de autenticación y que la usuaria sea **admin** o la usuaria a eliminar
   * @response {Object} user
   * @response {String} user._id
   * @response {Object} user.email
   * @response {Object} user.roles
   * @response {Boolean} user.roles.admin
   * @code {200} si la autenticación es correcta
   * @code {401} si no hay cabecera de autenticación
   * @code {403} si no es ni admin o la misma usuaria
   * @code {404} si la usuaria solicitada no existe
   */
  app.delete('/users/:uid', requireAuth, requireAdmin, async(req, resp, next) => {

    try {
      const { Client, db } = await connect();
      const Users = db.collection('Users');
        
      let requestedUser;
      if (ObjectId.isValid(req.params.uid)) {
        requestedUser = await Users.findOne({ _id: new ObjectId(req.params.uid) });
      } else {
        requestedUser = await Users.findOne({ email: req.params.uid });
      }
      
      if (!requestedUser) {
        return resp.status(404).json({ message: "Usuario no encontrado" }); // El error esta aquí
      }
      
      const deletedUser = await Users.deleteOne({ _id: requestedUser._id }, { email: requestedUser.email });
      
      if (deletedUser.deletedCount === 0) {
        return resp.status(404).json({ message: "El usuario solicitado no existe" });
      }
      
      resp.status(200).json({ message: "Usuario eliminado correctamente" });
      await Client.close();
    } catch (error) {
      next(error);
    }

  });

  initAdminUser(app, next);
};
