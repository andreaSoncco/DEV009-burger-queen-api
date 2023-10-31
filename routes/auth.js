const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Agregar importación para bcrypt
const config = require('../config');
const { connect } = require('../connect');
// const express = require('express');
// const app = express();

// app.use(express.json()); // Para JSON
// app.use(express.urlencoded({ extended: true })); // Para datos codificados en URL


const { secret } = config;
const saltRounds = 10; // Define la cantidad de rondas para bcrypt

module.exports = (app, nextMain) => {
  app.post('/auth', async (req, resp, next) => {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        return resp.status(400).json({ error: 'Email and password are required' });
      }

      const { client, db } = await connect();
      const Users = db.collection('Users');
      const userExist = await Users.findOne({ email: email });
      await client.close(); // Asegúrate de cerrar la conexión a la base de datos
      if (!userExist) {
        return resp.status(404).json({ error: 'User not found' });
      }

      const isPasswordMatched = await bcrypt.compare(password, userExist.password);
      if (!isPasswordMatched) {
        return resp.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: userExist._id }, secret);

      resp.cookie('token', token, { httpOnly: true }); // Configura la cookie en la respuesta

      return resp.status(200).json({ accessToken: token });

    } catch (error) {
      return resp.status(500).json({ error: error.message });
    }
  });

  return nextMain();
};
