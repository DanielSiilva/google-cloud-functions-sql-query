const functions = require("@google-cloud/functions-framework");
const knexConfig = require("./knexfile");
const knex = require("knex")(knexConfig);

functions.http("helloHttp", (req, res) => {
  knex("users")
    .first("name")
    .then((user) => {
      res.send(`Hello ${user.name}!`);
    })
    .catch((err) => {
      console.error("Erro ao acessar o banco de dados:", err);
      res.status(500).send("Erro ao acessar o banco de dados");
    })
    .finally(() => {
      knex.destroy();
    });
});
