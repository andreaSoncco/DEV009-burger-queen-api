const { MongoClient } = require('mongodb');
const { dbUrl } = require('./config');

async function connect() {
  const client = new MongoClient(dbUrl);
  try {
    await client.connect();
    const db = client.db('BurgerQueenAPI');
    return { client, db };
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    throw error; // Esto es importante para propagar el error hacia arriba
  }
}

module.exports = { connect };


