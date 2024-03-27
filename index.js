const functions = require("@google-cloud/functions-framework");
const ping = require("ping");
const { Telnet } = require("telnet-client");

async function pingHosts(hosts) {
  const results = {};
  for (const host of hosts) {
    const res = await ping.promise.probe(host, { min_reply: 3 });
    results[host] = res;
  }
  return results;
}

async function telnetHosts(hostsAndPorts) {
  const results = {};
  for (const { host, port } of hostsAndPorts) {
    const connection = new Telnet();
    let params = {
      host: host,
      port: port,
      negotiationMandatory: false,
      timeout: 15000,
    };

    try {
      await connection.connect(params);
      connection.end();
      results[`${host}:${port}`] = `is reachable.`;
    } catch (error) {
      results[`${host}:${port}`] = `is not reachable. Error: ${error.message}`;
    }
  }
  return results;
}

functions.http("helloHttp", async (req, res) => {
  const hosts = ["192.168.9.200", "192.168.9.100"];
  const pingResults = await pingHosts(hosts);

  const telnetResults = await telnetHosts([
    { host: "192.168.9.200", port: 1433 },
    { host: "192.168.9.100", port: 1433 },
  ]);

  res.send({
    message: `Hello ${req.query.name || req.body.name || "World"}!`,
    pingResults,
    telnetResults,
  });
});
