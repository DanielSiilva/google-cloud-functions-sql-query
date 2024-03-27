const functions = require("@google-cloud/functions-framework");
const knexConfig = require("./knexfile");
const knex = require("knex")(knexConfig);

const BEARER_TOKEN = "teste_token";

functions.http("helloHttp", async (req, res) => {
  const authHeader = req.headers.authorization;
  const sql = req.body.name;

  let id = "ID" || "id" || "Id";
  const orderByColumn = req.body.orderByColumn || id;
  const page = parseInt(req.body.page || req.query.page || 1, 10);

  let pageSize = parseInt(req.body.pageSize || req.query.pageSize || 100, 10);

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Not authorized. Missing authorization header." });
  }

  const tokenParts = authHeader.split(" ");

  if (
    tokenParts.length !== 2 ||
    tokenParts[0] !== "Bearer" ||
    tokenParts[1] !== BEARER_TOKEN
  ) {
    return res.status(401).json({ message: "Not authorized." });
  }

  if (!sql) {
    return res.status(400).json({
      message: "It is necessary to pass SQL in the body of the request",
    });
  }

  const tableNameMatch = sql.match(/FROM dbo\.(\w+)/i);
  const tableExists = await knex.schema.hasTable(tableNameMatch[1]);
  if (!tableExists) {
    return res.status(404).json({ message: "Table not found." });
  }

  const offset = (page - 1) * pageSize;

  try {
    const countQuery = `SELECT COUNT(*) AS totalCount FROM (${sql}) AS count_table`;
    const countResult = await knex.raw(countQuery);

    if (countResult[0].totalCount < 100) {
      pageSize = countResult[0].totalCount;
    }

    const totalCount = parseInt(countResult[0].totalCount, 10);

    const paginatedSql = `${sql} ORDER BY ${orderByColumn} OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
    const paginatedResult = await knex.raw(paginatedSql);

    const data = paginatedResult;

    const totalPages = Math.ceil(totalCount / pageSize);

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
    console.error("Error executing SQL query:", error);
    res.status(500).send("Internal server error");
  }
});
