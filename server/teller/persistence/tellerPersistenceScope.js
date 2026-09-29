const ALLOWED_TELLER_ROLES =
  new Set([
    "employee",
    "manager",
    "owner",
  ]);


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


export function assertTellerPersistenceScope(
  scope
) {
  const businessKey =
    clean(
      scope?.businessKey ||
      scope?.business_key
    );


  const actorId =
    clean(
      scope?.actorId ||
      scope?.actor_id
    );


  const actorRole =
    clean(
      scope?.actorRole ||
      scope?.actor_role
    ).toLowerCase();


  const towerSessionId =
    clean(
      scope?.towerSessionId ||
      scope?.tower_session_id
    );


  if (!businessKey) {
    throw new Error(
      "Teller persistence requires a Tower-authorized business key."
    );
  }


  if (!actorId) {
    throw new Error(
      "Teller persistence requires a Tower-authorized actor ID."
    );
  }


  if (
    !ALLOWED_TELLER_ROLES.has(
      actorRole
    )
  ) {
    throw new Error(
      "Teller persistence requires an allowed Tower role."
    );
  }


  if (!towerSessionId) {
    throw new Error(
      "Teller persistence requires a Tower session ID."
    );
  }


  return Object.freeze({
    businessKey,
    actorId,
    actorRole,
    towerSessionId,
  });
}


export async function withTellerBusinessTransaction(
  pool,
  scope,
  work
) {
  if (
    !pool ||
    typeof pool.connect !== "function"
  ) {
    throw new Error(
      "A PostgreSQL pool is required."
    );
  }


  if (
    typeof work !== "function"
  ) {
    throw new Error(
      "A Teller persistence transaction callback is required."
    );
  }


  const trusted =
    assertTellerPersistenceScope(
      scope
    );


  const client =
    await pool.connect();


  try {
    await client.query(
      "BEGIN"
    );


    await client.query(
      "SELECT set_config('app.teller_business_key', $1, true)",
      [
        trusted.businessKey,
      ]
    );


    await client.query(
      "SELECT set_config('app.teller_actor_id', $1, true)",
      [
        trusted.actorId,
      ]
    );


    await client.query(
      "SELECT set_config('app.teller_role', $1, true)",
      [
        trusted.actorRole,
      ]
    );


    await client.query(
      "SELECT set_config('app.teller_tower_session_id', $1, true)",
      [
        trusted.towerSessionId,
      ]
    );


    const result =
      await work(
        client,
        trusted
      );


    await client.query(
      "COMMIT"
    );


    return result;

  } catch (error) {

    try {
      await client.query(
        "ROLLBACK"
      );
    } catch {
      // Preserve the original persistence error.
    }


    throw error;

  } finally {

    client.release();
  }
}
