const Pool = require('pg').Pool;
const pool = new Pool({
  user: process.env.databaseUser || "postgres",
  password: process.env.databasePassword || "root",
  host: process.env.databaseHost || "localhost",
  port: process.env.databasePort || 5432,
  database: process.env.database || "libraries",
});

module.exports = pool;