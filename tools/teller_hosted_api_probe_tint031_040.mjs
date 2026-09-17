/*
 * TINT039 — Hosted Teller API probe.
 *
 * This tool is intentionally NOT executed during the source-build pack.
 *
 * Required after Render deployment:
 *
 *   TELLER_HOSTED_API_URL
 *
 * Optional authenticated probe:
 *
 *   TELLER_HOSTED_ACCESS_TOKEN
 *
 * The tool never accepts DATABASE_URL.
 */


function clean(
  value
) {
  return String(
    value || ""
  ).trim();
}


const baseUrl =
  clean(
    process.env
      .TELLER_HOSTED_API_URL
  )
    .replace(
      /\/+$/,
      ""
    );


const accessToken =
  clean(
    process.env
      .TELLER_HOSTED_ACCESS_TOKEN
  );


if (!baseUrl) {
  throw new Error(
    "TELLER_HOSTED_API_URL is required."
  );
}


const parsed =
  new URL(
    baseUrl
  );


if (
  parsed.protocol !==
  "https:"
) {
  throw new Error(
    "Hosted Teller API must use HTTPS."
  );
}


async function call(
  path,
  {
    token = "",
  } = {}
) {
  const headers = {};


  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  const response =
    await fetch(
      `${baseUrl}${path}`,
      {
        headers,
      }
    );


  let payload = {};


  try {
    payload =
      await response.json();

  } catch {
    payload = {};
  }


  return {
    status:
      response.status,

    payload,
  };
}


const health =
  await call(
    "/healthz"
  );


if (
  health.status !== 200 ||
  health.payload
    ?.status !== "ok"
) {
  throw new Error(
    "Hosted Teller /healthz failed."
  );
}


const ready =
  await call(
    "/readyz"
  );


if (
  ready.status !== 200 ||
  ready.payload
    ?.ready !== true
) {
  throw new Error(
    "Hosted Teller /readyz failed."
  );
}


const anonymous =
  await call(
    "/v1/records"
  );


if (
  anonymous.status !== 401
) {
  throw new Error(
    "Hosted Teller anonymous persistence access was not blocked."
  );
}


console.log(
  "HOSTED TELLER PUBLIC PROBE PASSED"
);

console.log(
  "healthz: PASSED"
);

console.log(
  "readyz: PASSED"
);

console.log(
  "anonymous record access blocked: PASSED"
);


if (accessToken) {
  const authenticated =
    await call(
      "/v1/records?limit=5",
      {
        token:
          accessToken,
      }
    );


  if (
    authenticated.status !== 200
  ) {
    throw new Error(
      "Hosted Teller authenticated persistence probe failed."
    );
  }


  console.log(
    "authenticated record query: PASSED"
  );

} else {

  console.log(
    "authenticated record query: SKIPPED — no hosted access token supplied"
  );
}
