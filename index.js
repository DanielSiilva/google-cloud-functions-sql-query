const functions = require("@google-cloud/functions-framework");
const knexConfig = require("./knexfile");
const knex = require("knex")(knexConfig);

functions.http("helloHttp", async (req, res) => {
  const sql = req.body.name;
  const page = parseInt(req.body.page || req.query.page || 1, 10);
  const pageSize = parseInt(req.body.pageSize || req.query.pageSize || 10, 10);
  const orderByColumn = req.body.orderByColumn || "ID";

  if (!sql) {
    return res
      .status(400)
      .json({ message: "É necessário passar o SQL no corpo da requisição" });
  }

  const offset = (page - 1) * pageSize;

  try {
    const paginatedSql = `${sql} ORDER BY ${orderByColumn} OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;

    const result = await knex.raw(paginatedSql);
    console.log("Resultado:", result);
    res.json({ data: result, page, pageSize });
  } catch (error) {
    console.error("Erro ao executar a consulta SQL:", error);
    res.status(500).send("Erro interno do servidor");
  }
});
