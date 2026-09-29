import {
  createTellerPostgresPool,
} from "./tellerPostgresPool.js";

import {
  readTellerPersistenceConfig,
  tellerPersistenceSafeSummary,
} from "./tellerPersistenceConfig.js";


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
      "Teller persistence is not configured."
    );
  }


  const pool =
    createTellerPostgresPool();


  try {
    const result =
      await pool.query(
        `
          SELECT
            current_database() AS database_name,
            NOW() AS checked_at
        `
      );


    console.log({
      healthy:
        true,

      database_name:
        result.rows[0]
          ?.database_name ||
        "",

      checked_at:
        result.rows[0]
          ?.checked_at ||
        null,
    });

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
