const SAFE_SOURCE_TOKEN =
  /^[A-Za-z0-9._:/-]{1,160}$/;


function clean(value) {
  return String(value ?? "").trim();
}


function safeSourceToken(value) {
  const text = clean(value);

  if (!text || !SAFE_SOURCE_TOKEN.test(text)) {
    return "";
  }

  return text;
}


export const TELLER_API_CONTRACT_VERSION =
  "teller-persistence-http.v1";

export const TELLER_PERSISTENCE_TOKEN_CONTRACT =
  "teller-persistence-token-v1";

export const TELLER_TOWER_EXCHANGE_CONTRACT =
  "tower-teller-exchange.v2";


export function readTellerReleaseIdentity(env = process.env) {
  const sourceRevision = safeSourceToken(
    env.TELLER_SOURCE_REVISION ||
    env.RENDER_GIT_COMMIT
  );

  const sourceBranch = safeSourceToken(
    env.TELLER_SOURCE_BRANCH ||
    env.RENDER_GIT_BRANCH
  );

  return Object.freeze({
    sourceRevision,
    sourceBranch,
    apiContract:
      TELLER_API_CONTRACT_VERSION,
    persistenceTokenContract:
      TELLER_PERSISTENCE_TOKEN_CONTRACT,
    towerExchangeContract:
      TELLER_TOWER_EXCHANGE_CONTRACT,
    renderServicePresent:
      Boolean(
        clean(
          env.RENDER_SERVICE_ID
        )
      ),
  });
}


export function tellerReleaseIdentitySafeSummary(identity) {
  return Object.freeze({
    source_revision:
      safeSourceToken(
        identity?.sourceRevision
      ),

    source_branch:
      safeSourceToken(
        identity?.sourceBranch
      ),

    source_revision_present:
      Boolean(
        safeSourceToken(
          identity?.sourceRevision
        )
      ),

    source_branch_present:
      Boolean(
        safeSourceToken(
          identity?.sourceBranch
        )
      ),

    api_contract:
      clean(
        identity?.apiContract
      ) ||
      TELLER_API_CONTRACT_VERSION,

    persistence_token_contract:
      clean(
        identity
          ?.persistenceTokenContract
      ) ||
      TELLER_PERSISTENCE_TOKEN_CONTRACT,

    tower_exchange_contract:
      clean(
        identity?.towerExchangeContract
      ) ||
      TELLER_TOWER_EXCHANGE_CONTRACT,

    render_service_present:
      Boolean(
        identity
          ?.renderServicePresent
      ),

    secrets_exposed:
      false,

    database_credentials_exposed:
      false,
  });
}
