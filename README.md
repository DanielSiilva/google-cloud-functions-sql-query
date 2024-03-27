# google-cloud-functions-sql-query
google-cloud-functions-sql-query


Add file => knexfile.js

```
module.exports = {
  client: "mssql",
  connection: {
    server: "seu-server",
    user: "sqlserver",
    password: "sua-senha",
    database: "name_banco",
    port: 1433,
    options: {
      encrypt: true,
      enableArithAbort: true,
 trustServerCertificate: true,
    },
  },
};


```
