const config = require('./config');
const express = require('express');
const path = require('path');
const yaml = require('yamljs');  // Importa el paquete yamljs
const app = express();
module.exports = app;

// swagger
const swaggerUI = require('swagger-ui-express');
const openapiSpec = yaml.load(path.join(__dirname, 'openapi.yaml'));

app.use(express.json()); // Para JSON
app.use(express.urlencoded({ extended: true })); // Para datos codificados en URL
app.use('/api-doc', swaggerUI.serve, swaggerUI.setup(openapiSpec));

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