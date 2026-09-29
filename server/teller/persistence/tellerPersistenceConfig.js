export const TELLER_PERSISTENCE_STATUS =
  Object.freeze({
    DISABLED:
      "disabled",

    MISCONFIGURED:
      "misconfigured",

    READY:
      "ready",
  });


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function positiveInteger(
  value,
  fallback
) {
  const parsed =
    Number.parseInt(
      String(
        value || ""
      ),
      10
    );

  return (
    Number.isFinite(parsed) &&
    parsed > 0
  )
    ? parsed
    : fallback;
}


export function readTellerPersistenceConfig(
  env = process.env
) {
  const enabled =
    clean(
      env.TELLER_PERSISTENCE_ENABLED
    ).toLowerCase() ===
    "true";


  const databaseUrl =
    clean(
      env.DATABASE_URL
    );


  const sslMode =
    clean(
      env.TELLER_DATABASE_SSL_MODE
    ).toLowerCase() ||
    "require";


  const allowedSslModes =
    new Set([
      "disable",
      "require",
      "verify-full",
    ]);


  if (!enabled) {
    return Object.freeze({
      status:
        TELLER_PERSISTENCE_STATUS.DISABLED,

      enabled:
        false,

      configured:
        false,

      databaseUrl:
        "",

      sslMode,

      poolMax:
        5,

      statementTimeoutMs:
        10000,
    });
  }


  if (
    !databaseUrl ||
    !allowedSslModes.has(
      sslMode
    )
  ) {
    return Object.freeze({
      status:
        TELLER_PERSISTENCE_STATUS.MISCONFIGURED,

      enabled:
        true,

      configured:
        false,

      databaseUrl:
        "",

      sslMode,

      poolMax:
        positiveInteger(
          env.TELLER_DATABASE_POOL_MAX,
          5
        ),

      statementTimeoutMs:
        positiveInteger(
          env.TELLER_DATABASE_STATEMENT_TIMEOUT_MS,
          10000
        ),
    });
  }


  return Object.freeze({
    status:
      TELLER_PERSISTENCE_STATUS.READY,

    enabled:
      true,

    configured:
      true,

    databaseUrl,

    sslMode,

    poolMax:
      positiveInteger(
        env.TELLER_DATABASE_POOL_MAX,
        5
      ),

    statementTimeoutMs:
      positiveInteger(
        env.TELLER_DATABASE_STATEMENT_TIMEOUT_MS,
        10000
      ),
  });
}


export function tellerPersistenceSafeSummary(
  config
) {
  return Object.freeze({
    status:
      config?.status ||
      TELLER_PERSISTENCE_STATUS.DISABLED,

    enabled:
      Boolean(
        config?.enabled
      ),

    configured:
      Boolean(
        config?.configured
      ),

    sslMode:
      String(
        config?.sslMode ||
        ""
      ),

    databaseUrlPresent:
      Boolean(
        config?.databaseUrl
      ),

    credentialsExposed:
      false,
  });
}
