import ping from "ping";

console.log("Function Ping Cliente Individual");

export default async ({ data }) => {
  const error = [];
  const result = [];

  console.log("Iniciando ping cliente individual", { data });

  for (const item of data) {
    const { login, endereco_ip_acesso, options = {}, ...others } = item;

    if (!login && !endereco_ip_acesso) {
      console.log(
        `Requisição invalidos, era experado 'login' e 'endereco_ip_acesso'`,
        { login, endereco_ip_acesso }
      );
      error.push({ error: "request invalid" });
      continue;
    }

    console.log(`Ping host='${endereco_ip_acesso}'`);

    const pingResponse = await ping.promise
      .probe(endereco_ip_acesso, {
        timeout: 0.1,
        packetSize: 1400,
        min_reply: 10,
        deadline: 5,
        ...options,
      })
      .then((res) => {
        console.log(`Ping realizado com sucesso host=${endereco_ip_acesso}`);
        return res;
      })
      .catch((error) => {
        error.push({
          login,
          message: `Ocorreu um erro ao realizar ping`,
          error,
        });
        return {};
      });

    const jitter = pingResponse?.times.reduce(
      (total, current, currentIndex, times) => {
        const previous = currentIndex > 0 ? currentIndex - 1 : 0;
        return total + Math.abs(current - times[previous]);
      },
      0
    );

    if (pingResponse?.time === "unknown") pingResponse.time = null;

    result.push({
      ...others,
      login,
      host: pingResponse.host || null,
      time: pingResponse.time || null,
      min: parseFloat(pingResponse?.min),
      max: parseFloat(pingResponse?.max),
      avg: parseFloat(pingResponse?.avg),
      stddev: parseFloat(pingResponse?.stddev),
      jitter: parseFloat((jitter / pingResponse?.times?.length).toFixed(3)),
      packet_loss: parseFloat(pingResponse?.packetLoss),
    });

    console.log(`Ping realizado com sucesso host=${endereco_ip_acesso}`, {
      result,
    });
  }

  return {
    send: {
      error,
      data: result,
    },
  };
};
