import {
  readFile,
} from "node:fs/promises";

import {
  fileURLToPath,
} from "node:url";

import {
  dirname,
  resolve,
} from "node:path";

import {
  createTellerPostgresPool,
} from "./tellerPostgresPool.js";

import {
  readTellerPersistenceConfig,
  tellerPersistenceSafeSummary,
} from "./tellerPersistenceConfig.js";


const here =
  dirname(
    fileURLToPath(
      import.meta.url
    )
  );


const migrationPath =
  resolve(
    here,
    "migrations/001_teller_records.sql"
  );


async function main() {
  const config =
    readTellerPersistenceConfig();


  console.log(
    "Teller persistence config:",
    tellerPersistenceSafeSummary(
      config
    )
  );


  if (!config.configured) {
    throw new Error(
      "Teller persistence is not configured. Migration was not attempted."
    );
  }


  const migration =
    await readFile(
      migrationPath,
      "utf8"
    );


  const pool =
    createTellerPostgresPool();


  try {
    await pool.query(
      migration
    );


    console.log(
      "Teller persistence migration applied."
    );

  } finally {

    await pool.end();
  }
}


main().catch(
  (error) => {
    console.error(
      String(
        error?.message ||
        error
      )
    );

    process.exitCode = 1;
  }
);
