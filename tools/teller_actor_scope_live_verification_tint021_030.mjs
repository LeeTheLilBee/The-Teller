import assert
  from "node:assert/strict";

import {
  createTellerPostgresPool,
} from "../server/teller/persistence/tellerPostgresPool.js";


const pool =
  createTellerPostgresPool();


const client =
  await pool.connect();


try {
  const column =
    await client.query(
      `
        SELECT
          column_name,
          is_nullable,
          column_default

        FROM information_schema.columns

        WHERE
          table_schema = 'public'
          AND table_name = 'teller_records'
          AND column_name = 'actor_id'
      `
    );


  assert.equal(
    column.rows.length,
    1
  );


  assert.equal(
    column.rows[0]
      .is_nullable,
    "NO"
  );


  const rls =
    await client.query(
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


  assert.equal(
    rls.rows.length,
    2
  );


  assert.ok(
    rls.rows.every(
      (row) =>
        row.relrowsecurity === true &&
        row.relforcerowsecurity === true
    )
  );


  const policies =
    await client.query(
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

        ORDER BY
          tablename,
          policyname
      `
    );


  const policyNames =
    new Set(
      policies.rows.map(
        (row) =>
          row.policyname
      )
    );


  assert.ok(
    policyNames.has(
      "teller_records_business_isolation"
    )
  );


  assert.ok(
    policyNames.has(
      "teller_record_events_business_isolation"
    )
  );


  await client.query(
    "BEGIN"
  );


  await client.query(
    "SELECT set_config('app.teller_business_key', $1, true)",
    [
      "simplee_world_staging",
    ]
  );


  await client.query(
    "SELECT set_config('app.teller_actor_id', $1, true)",
    [
      "migration_verifier_owner",
    ]
  );


  await client.query(
    "SELECT set_config('app.teller_role', $1, true)",
    [
      "owner",
    ]
  );


  await client.query(
    "SELECT set_config('app.teller_tower_session_id', $1, true)",
    [
      "migration_verifier_session",
    ]
  );


  const rows =
    await client.query(
      `
        SELECT
          COUNT(*)::int AS total_records,

          COUNT(*) FILTER (
            WHERE
              actor_id IS NULL
              OR BTRIM(actor_id) = ''
          )::int AS missing_actor_ids,

          COUNT(*) FILTER (
            WHERE
              actor_id = 'legacy_unknown'
          )::int AS legacy_backfilled

        FROM teller_records
      `
    );


  await client.query(
    "ROLLBACK"
  );


  assert.equal(
    rows.rows[0]
      .missing_actor_ids,
    0
  );


  console.log(
    "TINT023 REPAIR A LIVE ACTOR-SCOPE VERIFICATION PASSED"
  );


  console.log(
    JSON.stringify({
      actor_id_not_null:
        true,

      rls_enabled:
        true,

      rls_forced:
        true,

      record_policy:
        true,

      event_policy:
        true,

      visible_staging_records:
        rows.rows[0]
          .total_records,

      missing_actor_ids:
        rows.rows[0]
          .missing_actor_ids,

      legacy_backfilled:
        rows.rows[0]
          .legacy_backfilled,
    })
  );

} finally {

  client.release();

  await pool.end();
}
