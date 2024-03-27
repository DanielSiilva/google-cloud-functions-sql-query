const functions = require("@google-cloud/functions-framework");
const knexConfig = require("./knexfile");
const knex = require("knex")(knexConfig);

functions.http("helloHttp", async (req, res) => {
  const sql = req.body.name;
  const page = parseInt(req.body.page || req.query.page || 1, 10);

  const pageSize = parseInt(req.body.pageSize || req.query.pageSize || 30, 10);

  const orderByColumn = req.body.orderByColumn || "ID";

  if (!sql) {
    return res
      .status(400)
      .json({ message: "É necessário passar o SQL no corpo da requisição" });
  }

  const offset = (page - 1) * pageSize;

  try {
    const countQuery = `SELECT COUNT(*) AS totalCount FROM (${sql}) AS count_table`;
    const countResult = await knex.raw(countQuery);

    const totalCount = parseInt(countResult[0].totalCount, 10);

    const paginatedSql = `${sql} ORDER BY ${orderByColumn} OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
    const paginatedResult = await knex.raw(paginatedSql);
    console.log("🚀 ~ functions.http ~ paginatedResult:", paginatedResult);

    const data = paginatedResult;

    const totalPages = Math.ceil(totalCount / pageSize);

    console.log({ page, pageSize, offset });
    console.log(paginatedSql);

    res.json({
      data: data,
      pageInfo: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Erro ao executar a consulta SQL:", error);
    res.status(500).send("Erro interno do servidor");
  }
});
