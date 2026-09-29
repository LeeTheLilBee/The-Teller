import {
  createTellerPostgresPool,
} from "../persistence/tellerPostgresPool.js";

import {
  createTellerPersistenceHttpServer,
} from "./tellerPersistenceHttpServer.js";

import {
  readTellerTransportConfig,
  tellerTransportSafeSummary,
} from "./tellerTransportConfig.js";


const config =
  readTellerTransportConfig();


console.log(
  "Teller transport config:",
  tellerTransportSafeSummary(
    config
  )
);


if (!config.configured) {
  throw new Error(
    "Teller persistence transport is not configured."
  );
}


const pool =
  createTellerPostgresPool();


const server =
  createTellerPersistenceHttpServer({
    pool,
  });


server.listen(
  config.port,
  "0.0.0.0",
  () => {
    console.log(
      `Teller persistence transport listening on port ${config.port}`
    );
  }
);


async function shutdown(
  signal
) {
  console.log(
    `Teller persistence transport shutting down: ${signal}`
  );


  server.close(
    async () => {
      await pool.end();

      process.exit(
        0
      );
    }
  );
}


process.on(
  "SIGTERM",
  () =>
    void shutdown(
      "SIGTERM"
    )
);


process.on(
  "SIGINT",
  () =>
    void shutdown(
      "SIGINT"
    )
);
