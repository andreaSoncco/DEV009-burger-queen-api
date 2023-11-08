const jwt = require('jsonwebtoken');
const { connect } = require('../connect');

// ... (código previo)

module.exports = {
  getUsers: async (req, resp, next) => {
    try {
      const { client, db } = await connect();

      const Users = db.collection('Users');

      // Buscar todos los usuarios en la colección
      const users = await Users.find({}).toArray();

      resp.json(users); // Enviar la lista de usuarios como respuesta
      await client.close();
    } catch (error) {
      next(error);
    }
  }
  
};

