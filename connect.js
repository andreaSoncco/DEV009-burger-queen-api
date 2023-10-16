const { MongoClient } = require('mongodb');
const { dbUrl } = require('./config');

async function connect() {
  const client = new MongoClient(dbUrl);
  try {
    await client.connect();
    const db = client.db('BurgerQueenAPI');
    console.log("hola");
    return db;
  } catch (error) {
    console.error('error', error);
  }
}


module.exports = { connect };
