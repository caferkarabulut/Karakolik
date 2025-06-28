// dbPool.js – MSSQL havuzu tek noktadan üretilip paylaşılsın
const sql = require('mssql');

module.exports = sql.connect({
  user    : process.env.DB_USER,
  password: process.env.DB_PASS,
  server  : process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options : { trustServerCertificate: true }
});
