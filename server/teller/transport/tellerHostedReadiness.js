export const TELLER_HOSTED_READINESS =
  Object.freeze({
    READY:
      "ready",

    CONFIGURATION_BLOCKED:
      "configuration_blocked",

    DATABASE_UNAVAILABLE:
      "database_unavailable",
  });


export async function checkTellerHostedReadiness({
  pool,
  config,
} = {}) {
  if (
    !config?.configured
  ) {
    return Object.freeze({
      ready:
        false,

      status:
        TELLER_HOSTED_READINESS.CONFIGURATION_BLOCKED,

      database:
        "not_checked",

      transport:
        "blocked",
    });
  }


  if (
    !pool ||
    typeof pool.query !==
      "function"
  ) {
    return Object.freeze({
      ready:
        false,

      status:
        TELLER_HOSTED_READINESS.DATABASE_UNAVAILABLE,

      database:
        "unavailable",

      transport:
        "configured",
    });
  }


  try {
    const result =
      await pool.query(
        "SELECT 1 AS teller_ready"
      );


    if (
      Number(
        result
          ?.rows
          ?.[0]
          ?.teller_ready
      ) !== 1
    ) {
      throw new Error(
        "Unexpected database readiness response."
      );
    }


    return Object.freeze({
      ready:
        true,

      status:
        TELLER_HOSTED_READINESS.READY,

      database:
        "ready",

      transport:
        "configured",
    });

  } catch {
    return Object.freeze({
      ready:
        false,

      status:
        TELLER_HOSTED_READINESS.DATABASE_UNAVAILABLE,

      database:
        "unavailable",

      transport:
        "configured",
    });
  }
}
