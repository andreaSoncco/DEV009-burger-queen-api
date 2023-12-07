exports.port = process.argv[2] || process.env.PORT || 8080;
exports.dbUrl = process.env.MONGO_URL || process.env.DB_URL || 'mongodb+srv://andreasoncco:FihyQUvO6h4NTRny@mongodb.g4jsjsj.mongodb.net/mongodb?retryWrites=true&w=majority';
exports.secret = process.env.JWT_SECRET || 'esta-es-la-api-burger-queen';
exports.adminEmail = process.env.ADMIN_EMAIL || 'andrea.soncco.c@gmail.com';
exports.adminPassword = process.env.ADMIN_PASSWORD || 'ElijoSerFeliz27';
exports.id = process.env.ID || 1;