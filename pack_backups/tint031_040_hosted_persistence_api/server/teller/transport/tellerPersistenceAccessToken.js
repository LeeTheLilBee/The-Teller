import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";


const TOKEN_VERSION =
  "tpt1";


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


function encode(
  value
) {
  return Buffer
    .from(
      value,
      "utf8"
    )
    .toString(
      "base64url"
    );
}


function decode(
  value
) {
  return Buffer
    .from(
      value,
      "base64url"
    )
    .toString(
      "utf8"
    );
}


function signatureFor(
  signingInput,
  secret
) {
  return createHmac(
    "sha256",
    secret
  )
    .update(
      signingInput
    )
    .digest(
      "base64url"
    );
}


function equalSignature(
  left,
  right
) {
  const leftBuffer =
    Buffer.from(
      left
    );


  const rightBuffer =
    Buffer.from(
      right
    );


  return (
    leftBuffer.length ===
      rightBuffer.length &&
    timingSafeEqual(
      leftBuffer,
      rightBuffer
    )
  );
}


function normalizeClaims(
  claims
) {
  const actorRole =
    clean(
      claims?.actor_role
    ).toLowerCase();


  if (
    !ALLOWED_ROLES.has(
      actorRole
    )
  ) {
    throw new Error(
      "Invalid Teller persistence actor role."
    );
  }


  const normalized = {
    iss:
      clean(
        claims?.iss
      ),

    aud:
      clean(
        claims?.aud
      ),

    iat:
      Number(
        claims?.iat
      ),

    exp:
      Number(
        claims?.exp
      ),

    jti:
      clean(
        claims?.jti
      ),

    tower_session_id:
      clean(
        claims?.tower_session_id
      ),

    tower_receipt_id:
      clean(
        claims?.tower_receipt_id
      ),

    actor_id:
      clean(
        claims?.actor_id
      ),

    actor_role:
      actorRole,

    business_key:
      clean(
        claims?.business_key
      ),
  };


  for (
    const required
    of [
      "iss",
      "aud",
      "jti",
      "tower_session_id",
      "actor_id",
      "actor_role",
      "business_key",
    ]
  ) {
    if (!normalized[required]) {
      throw new Error(
        `Missing persistence-token claim: ${required}`
      );
    }
  }


  if (
    !Number.isInteger(
      normalized.iat
    ) ||
    !Number.isInteger(
      normalized.exp
    )
  ) {
    throw new Error(
      "Persistence token timestamps are invalid."
    );
  }


  return Object.freeze(
    normalized
  );
}


export function signTellerPersistenceAccessToken({
  claims,
  secret,
}) {
  if (
    !secret ||
    String(
      secret
    ).length < 32
  ) {
    throw new Error(
      "Teller persistence signing secret is not configured."
    );
  }


  const payload =
    encode(
      JSON.stringify(
        normalizeClaims(
          claims
        )
      )
    );


  const signingInput =
    `${TOKEN_VERSION}.${payload}`;


  const signature =
    signatureFor(
      signingInput,
      secret
    );


  return (
    `${signingInput}.${signature}`
  );
}


export function verifyTellerPersistenceAccessToken({
  token,
  secret,
  issuer = "tower",
  audience = "teller-persistence",
  nowSeconds = Math.floor(
    Date.now() /
    1000
  ),
  maxLifetimeSeconds = 900,
}) {
  if (
    !secret ||
    String(
      secret
    ).length < 32
  ) {
    throw new Error(
      "Teller persistence token verifier is not configured."
    );
  }


  const parts =
    String(
      token || ""
    )
      .split(".");


  if (
    parts.length !== 3 ||
    parts[0] !== TOKEN_VERSION
  ) {
    throw new Error(
      "Invalid Teller persistence access token."
    );
  }


  const [
    version,
    payload,
    suppliedSignature,
  ] = parts;


  const signingInput =
    `${version}.${payload}`;


  const expectedSignature =
    signatureFor(
      signingInput,
      secret
    );


  if (
    !equalSignature(
      suppliedSignature,
      expectedSignature
    )
  ) {
    throw new Error(
      "Invalid Teller persistence access token signature."
    );
  }


  let parsed = null;


  try {
    parsed =
      JSON.parse(
        decode(
          payload
        )
      );

  } catch {
    throw new Error(
      "Invalid Teller persistence access token payload."
    );
  }


  const claims =
    normalizeClaims(
      parsed
    );


  if (
    claims.iss !==
    issuer
  ) {
    throw new Error(
      "Teller persistence token issuer mismatch."
    );
  }


  if (
    claims.aud !==
    audience
  ) {
    throw new Error(
      "Teller persistence token audience mismatch."
    );
  }


  if (
    claims.exp <=
    nowSeconds
  ) {
    throw new Error(
      "Teller persistence access token expired."
    );
  }


  if (
    claims.iat >
    nowSeconds + 60
  ) {
    throw new Error(
      "Teller persistence token issued-at time is invalid."
    );
  }


  const lifetime =
    claims.exp -
    claims.iat;


  if (
    lifetime <= 0 ||
    lifetime >
    maxLifetimeSeconds
  ) {
    throw new Error(
      "Teller persistence token lifetime exceeds policy."
    );
  }


  return claims;
}


export function tellerPersistenceScopeFromClaims(
  claims
) {
  return Object.freeze({
    businessKey:
      claims.business_key,

    actorId:
      claims.actor_id,

    actorRole:
      claims.actor_role,

    towerSessionId:
      claims.tower_session_id,

    towerReceiptId:
      claims.tower_receipt_id,
  });
}
