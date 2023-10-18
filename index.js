const config = require('./config');
const express = require('express');
const app = express();


module.exports = app;


const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/error');
const routes = require('./routes');
const pkg = require('./package.json');




const { port, secret } = config;

app.set('config', config);
app.set('pkg', pkg);

// parse application/x-www-form-urlencoded
// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());
app.use(authMiddleware(secret));

// Registrar rutas
routes(app, (err) => {
  if (err) {
    throw err;
  }

  app.use(errorHandler);

  app.listen(port, () => {
    console.info(`App listening on port ${port}`);
  });
});




/*
 const { MongoClient } = require("mongodb");

// Replace the uri string with your connection string.
const uri = "mongodb+srv://daleskaSoncco:tomaleche88.@data.qyk0xrv.mongodb.net/?retryWrites=true&w=majority";

const project = new MongoClient(uri);

async function run() {
  try {
    const database = project.db('BurgerQueenAPI');
    const users = database.collection('Users');

    // Query for a movie that has the title 'Back to the Future'
    const query = { role: 'admin' };
    const user = await users.findOne(query);

    console.log(user);
  } finally {
    // Ensures that the client will close when you finish/error
    await project.close();
  }
}
run().catch(console.dir);
*/