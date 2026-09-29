import {
  readdir,
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


const migrationsDirectory =
  resolve(
    here,
    "migrations"
  );


async function listMigrations() {
  const names =
    await readdir(
      migrationsDirectory
    );


  return names
    .filter(
      (name) =>
        /^\d+_.+\.sql$/
          .test(
            name
          )
    )
    .sort();
}


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


  const migrations =
    await listMigrations();


  if (!migrations.length) {
    throw new Error(
      "No Teller persistence migrations found."
    );
  }


  const pool =
    createTellerPostgresPool();


  try {
    for (
      const name
      of migrations
    ) {
      const path =
        resolve(
          migrationsDirectory,
          name
        );


      const sql =
        await readFile(
          path,
          "utf8"
        );


      await pool.query(
        sql
      );


      console.log(
        `Applied Teller migration: ${name}`
      );
    }


    console.log(
      `Teller persistence migrations applied: ${migrations.length}`
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
