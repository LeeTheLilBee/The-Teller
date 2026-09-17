import pg
  from "pg";


const {
  Pool,
} = pg;


const databaseUrl =
  process.env.DATABASE_URL;


if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required."
  );
}


const pool =
  new Pool({
    connectionString:
      databaseUrl,

    ssl: {
      rejectUnauthorized:
        false,
    },

    max:
      2,

    application_name:
      "simplee-teller-tint011-020-verify",
  });


async function scalar(
  text,
  params = []
) {
  const result =
    await pool.query(
      text,
      params
    );

  return result.rows;
}


try {
  const version =
    await scalar(
      "SELECT current_database() AS database_name, current_user AS database_user, version() AS version"
    );


  const tables =
    await scalar(
      `
        SELECT
          tablename,
          rowsecurity
        FROM pg_tables
        WHERE
          schemaname = 'public'
          AND tablename IN (
            'teller_records',
            'teller_record_events'
          )
        ORDER BY tablename
      `
    );


  const forceRls =
    await scalar(
      `
        SELECT
          relname,
          relrowsecurity,
          relforcerowsecurity
        FROM pg_class
        WHERE
          relname IN (
            'teller_records',
            'teller_record_events'
          )
        ORDER BY relname
      `
    );


  const policies =
    await scalar(
      `
        SELECT
          tablename,
          policyname
        FROM pg_policies
        WHERE
          schemaname = 'public'
          AND tablename IN (
            'teller_records',
            'teller_record_events'
          )
        ORDER BY tablename, policyname
      `
    );


  const indexes =
    await scalar(
      `
        SELECT
          indexname
        FROM pg_indexes
        WHERE
          schemaname = 'public'
          AND tablename IN (
            'teller_records',
            'teller_record_events'
          )
        ORDER BY indexname
      `
    );


  if (tables.length !== 2) {
    throw new Error(
      "Expected both Teller persistence tables."
    );
  }


  if (
    forceRls.length !== 2 ||
    forceRls.some(
      (row) =>
        row.relrowsecurity !== true ||
        row.relforcerowsecurity !== true
    )
  ) {
    throw new Error(
      "Teller persistence RLS is not enabled and forced on both tables."
    );
  }


  const requiredPolicies =
    new Set([
      "teller_records_business_isolation",
      "teller_record_events_business_isolation",
    ]);


  const actualPolicies =
    new Set(
      policies.map(
        (row) =>
          row.policyname
      )
    );


  for (
    const policy
    of requiredPolicies
  ) {
    if (
      !actualPolicies.has(
        policy
      )
    ) {
      throw new Error(
        `Missing Teller RLS policy: ${policy}`
      );
    }
  }


  console.log(
    "TINT014 LIVE DATABASE VERIFICATION PASSED"
  );

  console.log({
    database:
      version[0]
        ?.database_name ||
      "",

    tables:
      tables.map(
        (row) =>
          row.tablename
      ),

    forced_rls:
      forceRls.map(
        (row) => ({
          table:
            row.relname,

          enabled:
            row.relrowsecurity,

          forced:
            row.relforcerowsecurity,
        })
      ),

    policies:
      [...actualPolicies],

    index_count:
      indexes.length,
  });

} finally {

  await pool.end();
}
