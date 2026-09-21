
const ALLOWED_ROLES =
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


function normalizeRole(
  value
) {
  const role =
    clean(
      value
    ).toLowerCase();


  return ALLOWED_ROLES.has(
    role
  )
    ? role
    : "";
}


function normalizeApiUrl({
  value,
  devMode = false,
} = {}) {
  const candidate =
    clean(
      value
    ).replace(
      /\/+$/,
      ""
    );


  if (!candidate) {
    return "";
  }


  let parsed = null;


  try {
    parsed =
      new URL(
        candidate
      );

  } catch {
    return "";
  }


  if (
    parsed.protocol ===
      "https:"
  ) {
    return candidate;
  }


  const loopback =
    parsed.hostname ===
      "localhost" ||
    parsed.hostname ===
      "127.0.0.1" ||
    parsed.hostname ===
      "::1";


  if (
    devMode &&
    parsed.protocol ===
      "http:" &&
    loopback
  ) {
    return candidate;
  }


  return "";
}


function tokenLooksLikeTpt1(
  token
) {
  return (
    /^tpt1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
      .test(
        clean(
          token
        )
      )
  );
}


function actorIdFromSession(
  session
) {
  const actor =
    session?.actor &&
    typeof session.actor ===
      "object"
      ? session.actor
      : {};


  return clean(
    actor.id ||
    actor.actor_id ||
    actor.actorId
  );
}


function businessKeyFromSession(
  session
) {
  const business =
    session?.business &&
    typeof session.business ===
      "object"
      ? session.business
      : {};


  return clean(
    business.key ||
    business.business_key ||
    business.businessKey
  );
}


export function describeTellerHostedPersistenceActivation({
  session,
  accessToken,
  apiUrl,
  devMode = false,
} = {}) {
  const resolvedApiUrl =
    normalizeApiUrl({
      value:
        apiUrl,

      devMode,
    });


  const sessionId =
    clean(
      session?.sessionId ||
      session?.session_id ||
      session?.tower_session_id
    );


  const towerReceiptId =
    clean(
      session?.towerReceiptId ||
      session?.tower_receipt_id
    );


  const actorId =
    actorIdFromSession(
      session
    );


  const businessKey =
    businessKeyFromSession(
      session
    );


  const role =
    normalizeRole(
      session?.role
    );


  const source =
    clean(
      session?.source
    );


  const token =
    clean(
      accessToken
    );


  const blockers = [];


  if (!session) {
    blockers.push(
      "tower_session_missing"
    );
  }


  if (
    session &&
    source !==
      "tower_window_injection"
  ) {
    blockers.push(
      "live_tower_window_injection_required"
    );
  }


  if (!sessionId) {
    blockers.push(
      "tower_session_id_missing"
    );
  }


  if (!towerReceiptId) {
    blockers.push(
      "tower_receipt_id_missing"
    );
  }


  if (!actorId) {
    blockers.push(
      "actor_id_missing"
    );
  }


  if (!businessKey) {
    blockers.push(
      "business_key_missing"
    );
  }


  if (!role) {
    blockers.push(
      "actor_role_invalid"
    );
  }


  if (!resolvedApiUrl) {
    blockers.push(
      "hosted_api_url_missing_or_invalid"
    );
  }


  if (!token) {
    blockers.push(
      "persistence_access_token_missing"
    );

  } else if (
    !tokenLooksLikeTpt1(
      token
    )
  ) {
    blockers.push(
      "persistence_access_token_format_invalid"
    );
  }


  const identityKey = [
    sessionId,
    towerReceiptId,
    actorId,
    businessKey,
    role,
  ].join(
    "|"
  );


  return Object.freeze({
    ready:
      blockers.length ===
      0,

    blockers:
      Object.freeze([
        ...blockers,
      ]),

    apiUrl:
      resolvedApiUrl,

    source,

    sessionId,

    towerReceiptId,

    actorId,

    businessKey,

    role,

    identityKey,

    tokenPresent:
      Boolean(
        token
      ),

    tokenShapeValid:
      tokenLooksLikeTpt1(
        token
      ),

    browserDatabaseCredentials:
      false,

    browserSigningSecret:
      false,

    tokenStorageAllowed:
      false,

    bodyAuthorityAllowed:
      false,

    directVaultAllowed:
      false,
  });
}
