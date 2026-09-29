import pg
  from "pg";

import {
  readTellerPersistenceConfig,
  TELLER_PERSISTENCE_STATUS,
} from "./tellerPersistenceConfig.js";


const {
  Pool,
} = pg;


function sslConfig(
  sslMode
) {
  if (
    sslMode === "disable"
  ) {
    return false;
  }


  if (
    sslMode === "verify-full"
  ) {
    return {
      rejectUnauthorized:
        true,
    };
  }


  return {
    rejectUnauthorized:
      false,
  };
}


export function createTellerPostgresPool({
  env = process.env,
} = {}) {
  const config =
    readTellerPersistenceConfig(
      env
    );


  if (
    config.status !==
    TELLER_PERSISTENCE_STATUS.READY
  ) {
    throw new Error(
      "Teller production persistence is not configured."
    );
  }


  return new Pool({
    connectionString:
      config.databaseUrl,

    ssl:
      sslConfig(
        config.sslMode
      ),

    max:
      config.poolMax,

    statement_timeout:
      config.statementTimeoutMs,

    application_name:
      "simplee-teller",
  });
}
