require("dotenv").config();

module.exports = {
  client: "mssql",
  connection: {
    server: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT),
    options: {
      encrypt: true,
      enableArithAbort: true,
      trustServerCertificate: true,
      connectTimeout: 600000,
      requestTimeout: 600000,
    },
  },
};
