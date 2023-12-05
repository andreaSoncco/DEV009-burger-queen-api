const { MongoClient } = require('mongodb');
const { dbUrl } = require('./config');

async function connect() {
  const Client = new MongoClient(dbUrl);
  try {
    await Client.connect();
    const db = Client.db('BurgerQueenAPI');
    return { Client, db };
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    throw error; // Esto es importante para propagar el error hacia arriba
  }
}

module.exports = { connect };


