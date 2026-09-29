import {
  readTellerHostedRuntime,
} from "./tellerHostedRuntime.js";


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


function originAllowedForHostedRuntime(
  origin
) {
  try {
    const parsed =
      new URL(
        origin
      );


    return (
      parsed.protocol ===
      "https:"
    );

  } catch {
    return false;
  }
}


function dedupe(
  values
) {
  return [
    ...new Set(
      values
    ),
  ];
}


export function readTellerTransportConfig(
  env = process.env
) {
  const hostedRuntime =
    readTellerHostedRuntime(
      env
    );


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
    dedupe(
      clean(
        env.TELLER_ALLOWED_ORIGINS
      )
        .split(",")
        .map(
          (item) =>
            item.trim()
        )
        .filter(Boolean)
    );


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


  const maxTokenLifetimeSeconds =
    Math.min(
      positiveInteger(
        env.TELLER_TRANSPORT_MAX_TOKEN_LIFETIME_SECONDS,
        600
      ),
      900
    );


  const hostedOriginsValid =
    !hostedRuntime.hosted ||
    (
      allowedOrigins.length > 0 &&
      allowedOrigins.every(
        originAllowedForHostedRuntime
      )
    );


  const configured =
    (
      tokenSecret.length >= 32 &&
      Boolean(
        issuer
      ) &&
      Boolean(
        audience
      ) &&
      hostedOriginsValid
    );


  return Object.freeze({
    configured,

    hostedRuntime,

    tokenSecret,

    issuer,

    audience,

    allowedOrigins,

    hostedOriginsValid,

    port,

    maxBodyBytes,

    maxTokenLifetimeSeconds,
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

    runtime:
      config
        ?.hostedRuntime
        ?.runtime ||
      "local",

    hosted:
      Boolean(
        config
          ?.hostedRuntime
          ?.hosted
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

    hostedOriginsValid:
      Boolean(
        config?.hostedOriginsValid
      ),

    maxTokenLifetimeSeconds:
      Number(
        config?.maxTokenLifetimeSeconds ||
        0
      ),

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
