const HOSTED_RUNTIME_VALUES =
  new Set([
    "local",
    "staging",
    "production",
  ]);


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


function normalizedUrl(
  value
) {
  const text =
    clean(
      value
    );


  if (!text) {
    return "";
  }


  let parsed = null;


  try {
    parsed =
      new URL(
        text
      );

  } catch {
    return "";
  }


  return parsed
    .toString()
    .replace(
      /\/+$/,
      ""
    );
}


export function readTellerHostedRuntime(
  env = process.env
) {
  const requested =
    clean(
      env.TELLER_HOSTED_RUNTIME
    ).toLowerCase() ||
    "local";


  const runtime =
    HOSTED_RUNTIME_VALUES.has(
      requested
    )
      ? requested
      : "local";


  const publicBaseUrl =
    normalizedUrl(
      env.TELLER_PUBLIC_BASE_URL
    );


  return Object.freeze({
    runtime,

    hosted:
      runtime === "staging" ||
      runtime === "production",

    staging:
      runtime === "staging",

    production:
      runtime === "production",

    publicBaseUrl,
  });
}


export function tellerHostedRuntimeSafeSummary(
  runtime
) {
  return Object.freeze({
    runtime:
      runtime?.runtime ||
      "local",

    hosted:
      Boolean(
        runtime?.hosted
      ),

    staging:
      Boolean(
        runtime?.staging
      ),

    production:
      Boolean(
        runtime?.production
      ),

    publicBaseUrlPresent:
      Boolean(
        runtime?.publicBaseUrl
      ),
  });
}
