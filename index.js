require("dotenv").config();
const functions = require("@google-cloud/functions-framework");
const knexConfig = require("./knexfile");
const knex = require("knex")(knexConfig);

const BEARER_TOKEN = process.env.TOKEN;

async function sendConcurrentData(url, data, token, maxConcurrent = 10) {
  let baseDelay = 5000;

  async function sendItem(item) {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    });
    const endTime = Date.now();

    const duration = endTime - startTime;

    if (!response.ok) {
      throw new Error(
        `Error sending data to endpoint: ${url} - ${response.statusText}`
      );
    }

    baseDelay =
      duration < 3000 ? Math.max(baseDelay - 100, 1000) : baseDelay + 100;

    if (response.status === 429) {
      baseDelay = 10000;
    }

    return response.json();
  }

  for (let i = 0; i < data.length; i += maxConcurrent) {
    const batch = data.slice(i, i + maxConcurrent);
    console.log(
      `Sending batch of ${batch.length} items with ${baseDelay}ms delay...`
    );

    await Promise.all(batch.map((item) => sendItem(item)))
      .then((responses) => {
        console.log("Batch sent successfully:", responses);
      })
      .catch((error) => {
        console.error("Error sending batch:", error);
      });

    await new Promise((resolve) => setTimeout(resolve, baseDelay));
  }
}

functions.http("helloHttp", async (req, res) => {
  let authHeader = req.headers.authorization;
  const query = req.body.query;
  const type = req.body.return_type;
  const endpoint = req.body.return_endpoint;
  const bearer_token = req.body.return_bearer_token;

  if (!type) {
    return res.status(400).json({
      message: "It is necessary to pass return_type in the body of the request",
    });
  }

  if (!query) {
    return res.status(400).json({
      message: "It is necessary to pass SQL in the body of the request",
    });
  }

  switch (type) {
    case "direct":
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

      try {
        const dataResult = await knex.raw(query);

        res.json(dataResult);
      } catch (error) {
        console.error("Error executing SQL query:", error);
        res
          .status(500)
          .json({ message: "Internal server error", error: error.message });
      }
      break;

    case "endpoint":
      if (!bearer_token) {
        return res
          .status(401)
          .json({ message: "Not authorized. Missing authorization header." });
      }

      const dataForEndpoint = await knex.raw(query);
      const data = dataForEndpoint;

      sendConcurrentData(endpoint, data, bearer_token)
        .then(() => {
          console.log("Todos os lotes foram enviados com sucesso");
          res.status(200).json({ message: "Data sent successfully" });
        })
        .catch((error) => {
          console.error("Erro ao enviar dados", error);
          res
            .status(500)
            .json({ message: "Error sending data", error: error.toString() });
        });
      break;

    default:
      console.error("None of the options are valid");
      res.status(400).json({ message: "Invalid return_type provided" });
  }
});
