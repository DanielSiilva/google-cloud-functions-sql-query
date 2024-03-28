require("dotenv").config();
const functions = require("@google-cloud/functions-framework");
const knexConfig = require("./knexfile");
const knex = require("knex")(knexConfig);

const BEARER_TOKEN = process.env.TOKEN;

functions.http("helloHttp", async (req, res) => {
  const authHeader = req.headers.authorization;
  const sql = req.body.name;

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

  try {
    const dataResult = await knex.raw(sql);
    const data = dataResult;

    res.json({
      data,
    });
  } catch (error) {
    console.error("Error executing SQL query:", error);
    res.status(500).send("Internal server error");
  }
});
