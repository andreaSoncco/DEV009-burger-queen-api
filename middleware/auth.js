const jwt = require('jsonwebtoken');
const { connect } = require('../connect');
const { ObjectId } = require('mongodb'); // Importa ObjectID desde el driver de MongoDB

module.exports = (secret) => async (req, resp, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return next();
  }

  const [type, token] = authorization.split(' ');

  if (type.toLowerCase() !== 'bearer') {
    return next();
  }

  jwt.verify(token, secret, async (err, decodedToken) => {
    if (err) {
      return next(403);
    }

    // TODO: Verificar identidad del usuario usando `decodedToken.id`
    const { client, db } = await connect();
    try {
      const Users = db.collection('Users');
      const user = await Users.findOne({ _id: new ObjectId(decodedToken.id) }, { projection: { password: 0 } });
      console.log(decodedToken.id);


      if (!user) {
        return resp.status(404).json({ message: "No user found" });
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    } finally {
      await client.close();
    }
  });
};

module.exports.isAuthenticated = (req) => !!req.user;

module.exports.isAdmin = (req) => req.user && req.user.role === "admin";

module.exports.requireAuth = (req, resp, next) => (
  !module.exports.isAuthenticated(req) ? resp.status(401).send('Unauthorized') : next()
);

module.exports.requireAdmin = (req, resp, next) => (
  !module.exports.isAuthenticated(req) ? resp.status(401).send('Unauthorized') :
    !module.exports.isAdmin(req) ? resp.status(403).send('Forbidden') : next()
);


