const functions = require("@google-cloud/functions-framework");
const knexConfig = require("./knexfile");
const knex = require("knex")(knexConfig);

functions.http("helloHttp", (req, res) => {
  // res.send(`Hello ${req.query.name || req.body.name || "World"}!`);
  knex("EmailSent")
    .limit(10)
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      console.error("Erro ao acessar o banco de dados:", err);
      res.status(500).send("Erro ao acessar o banco de dados");
    });
  // .finally(() => {
  //   knex.destroy();
  // });
});
