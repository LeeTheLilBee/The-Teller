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
    Number.isFinite(
      parsed
    ) &&
    parsed > 0
  )
    ? parsed
    : fallback;
}


export function readTellerTransportConfig(
  env = process.env
) {
  const tokenSecret =
    clean(
      env.TELLER_TOWER_TOKEN_SECRET
    );


  const issuer =
    clean(
      env.TELLER_TRANSPORT_TOKEN_ISSUER
    ) ||
    "tower";


  const audience =
    clean(
      env.TELLER_TRANSPORT_TOKEN_AUDIENCE
    ) ||
    "teller-persistence";


  const allowedOrigins =
    clean(
      env.TELLER_ALLOWED_ORIGINS
    )
      .split(",")
      .map(
        (item) =>
          item.trim()
      )
      .filter(Boolean);


  const port =
    positiveInteger(
      env.PORT,
      10000
    );


  const maxBodyBytes =
    positiveInteger(
      env.TELLER_TRANSPORT_MAX_BODY_BYTES,
      524288
    );


  return Object.freeze({
    configured:
      tokenSecret.length >= 32,

    tokenSecret,

    issuer,

    audience,

    allowedOrigins,

    port,

    maxBodyBytes,
  });
}


export function tellerTransportSafeSummary(
  config
) {
  return Object.freeze({
    configured:
      Boolean(
        config?.configured
      ),

    issuer:
      String(
        config?.issuer ||
        ""
      ),

    audience:
      String(
        config?.audience ||
        ""
      ),

    allowedOriginCount:
      Array.isArray(
        config?.allowedOrigins
      )
        ? config.allowedOrigins.length
        : 0,

    port:
      Number(
        config?.port ||
        0
      ),

    tokenSecretPresent:
      Boolean(
        config?.tokenSecret
      ),

    tokenSecretExposed:
      false,
  });
}
