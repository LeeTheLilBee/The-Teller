import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def read(path):
    return (
        ROOT /
        path
    ).read_text(
        encoding="utf-8"
    )


def require(
    condition,
    message,
):
    if not condition:
        raise AssertionError(
            message
        )


def strip_js_comments(
    text,
):
    """
    Security checks must inspect executable JavaScript rather than
    treating security comments as executable behavior.
    """

    text = re.sub(
        r"/\*.*?\*/",
        "",
        text,
        flags=re.DOTALL,
    )


    text = re.sub(
        r"(^|\s)//[^\n]*",
        r"\1",
        text,
    )


    return text


required = [
    "server/teller/transport/tellerHostedRuntime.js",

    "server/teller/transport/tellerHostedReadiness.js",

    "server/teller/transport/tellerTransportConfig.js",

    "server/teller/transport/tellerPersistenceHttpServer.js",

    "server/teller/transport/tellerPersistenceAccessToken.js",

    "src/teller/persistence/tellerPersistenceTransport.js",

    "contracts/teller/teller_persistence_token_contract_v1.json",

    "deploy/render/teller-api-staging.json",

    "docs/teller/TOWER_HANDOFF_TELLER_PERSISTENCE_TOKEN_TINT031_040.md",

    "tools/teller_hosted_runtime_contract_test_tint031_040.mjs",

    "tools/teller_tower_token_handoff_test_tint031_040.mjs",

    "tools/teller_hosted_api_probe_tint031_040.mjs",
]


for rel in required:
    require(
        (
            ROOT /
            rel
        ).exists(),

        f"Missing TINT031–TINT040 file: {rel}",
    )


runtime = read(
    "server/teller/transport/tellerHostedRuntime.js"
)

readiness = read(
    "server/teller/transport/tellerHostedReadiness.js"
)

config = read(
    "server/teller/transport/tellerTransportConfig.js"
)

server = read(
    "server/teller/transport/tellerPersistenceHttpServer.js"
)

token = read(
    "server/teller/transport/tellerPersistenceAccessToken.js"
)

client = read(
    "src/teller/persistence/tellerPersistenceTransport.js"
)

tower_handoff = read(
    "docs/teller/TOWER_HANDOFF_TELLER_PERSISTENCE_TOKEN_TINT031_040.md"
)

probe = read(
    "tools/teller_hosted_api_probe_tint031_040.mjs"
)

probe_code = strip_js_comments(
    probe
)


contract = json.loads(
    read(
        "contracts/teller/teller_persistence_token_contract_v1.json"
    )
)


render_spec = json.loads(
    read(
        "deploy/render/teller-api-staging.json"
    )
)


# ==============================================================================================================
# TINT031 — HOSTED RUNTIME
# ==============================================================================================================

for marker in [
    "TELLER_HOSTED_RUNTIME",

    "staging",

    "production",

    "publicBaseUrl",
]:
    require(
        marker in runtime,

        f"Hosted runtime missing {marker}",
    )


# ==============================================================================================================
# TINT032 — HOSTED ORIGIN / TOKEN HARDENING
# ==============================================================================================================

for marker in [
    "hostedOriginsValid",

    "maxTokenLifetimeSeconds",

    "https:",
]:
    require(
        marker in config,

        f"Hosted security config missing {marker}",
    )


require(
    '"tower_receipt_id"'
    in token,

    "Tower receipt is not required by token normalization.",
)


# ==============================================================================================================
# TINT033 / TINT034 — LIVENESS / READINESS / HTTP
# ==============================================================================================================

for marker in [
    "checkTellerHostedReadiness",

    "SELECT 1 AS teller_ready",

    "DATABASE_UNAVAILABLE",
]:
    require(
        marker in readiness,

        f"Readiness boundary missing {marker}",
    )


for marker in [
    '"/healthz"',

    '"/readyz"',

    "maxLifetimeSeconds",

    "database_credentials_exposed",

    "token_secret_exposed",
]:
    require(
        marker in server,

        f"Hosted HTTP server missing {marker}",
    )


# ==============================================================================================================
# TINT035 — TOWER TOKEN CONTRACT
# ==============================================================================================================

require(
    contract[
        "issuer"
    ]
    == "tower",

    "Tower contract issuer incorrect.",
)


require(
    contract[
        "audience"
    ]
    == "teller-persistence",

    "Tower contract audience incorrect.",
)


require(
    contract[
        "maximum_lifetime_seconds"
    ]
    == 600,

    "Tower contract lifetime incorrect.",
)


for claim in [
    "tower_session_id",

    "tower_receipt_id",

    "actor_id",

    "actor_role",

    "business_key",
]:
    require(
        claim
        in contract[
            "required_claims"
        ],

        f"Tower token contract missing {claim}",
    )


# ==============================================================================================================
# TINT036 — RENDER STAGING SPEC
# ==============================================================================================================

require(
    render_spec[
        "service"
    ][
        "name"
    ]
    == "simplee-teller-api-staging",

    "Render staging service name incorrect.",
)


require(
    render_spec[
        "service"
    ][
        "branch"
    ]
    == "teller-tower-request-handoff-dev",

    "Render staging branch incorrect.",
)


require(
    render_spec[
        "service"
    ][
        "health_check_path"
    ]
    == "/readyz",

    "Render readiness path incorrect.",
)


require(
    render_spec[
        "service"
    ][
        "auto_deploy"
    ]
    is False,

    "Staging API auto-deploy must remain off.",
)


# ==============================================================================================================
# TINT037 — BROWSER HOSTED ENDPOINT
# ==============================================================================================================

for marker in [
    "normalizeTellerPersistenceApiUrl",

    "https:",

    "isLoopbackHost",

    'credentials:\n            "omit"',

    'referrerPolicy:\n            "no-referrer"',
]:
    require(
        marker in client,

        f"Secure browser endpoint missing {marker}",
    )


for forbidden in [
    "DATABASE_URL",

    "postgresql://",

    "postgres://",
]:
    require(
        forbidden.lower()
        not in client.lower(),

        f"Browser transport contains forbidden database value: {forbidden}",
    )


# ==============================================================================================================
# TINT039 — HOSTED PROBE
#
# IMPORTANT:
# Inspect executable source after JS comments are removed.
# The raw file is ALLOWED to document that DATABASE_URL is forbidden.
# ==============================================================================================================

require(
    "TELLER_HOSTED_API_URL"
    in probe_code,

    "Executable hosted probe API URL variable missing.",
)


require(
    "DATABASE_URL"
    not in probe_code,

    "Executable hosted probe must never read DATABASE_URL.",
)


require(
    "TELLER_HOSTED_ACCESS_TOKEN"
    in probe_code,

    "Hosted authenticated probe token variable missing.",
)


require(
    '"/healthz"'
    in probe_code,

    "Hosted probe health check missing.",
)


require(
    '"/readyz"'
    in probe_code,

    "Hosted probe readiness check missing.",
)


# ==============================================================================================================
# TELLER-ONLY TOWER HANDOFF
#
# Do NOT reject words like "modify Tower" when the sentence explicitly says
# Teller does NOT modify Tower.
# ==============================================================================================================

for marker in [
    "This document is a Teller-side handoff.",

    "It does not implement or modify Tower.",

    "Tower remains the authority for identity, role, business/entity access, session validity, step-up, and security receipts.",

    "Tower must issue a short-lived persistence access token.",

    "Teller does not persist the access token.",
]:
    require(
        marker in tower_handoff,

        f"Teller-only Tower handoff boundary missing: {marker}",
    )


# ==============================================================================================================
# VAULT BOUNDARY
# ==============================================================================================================

for text in [
    runtime,
    readiness,
    config,
    server,
    client,
]:
    require(
        "vault://"
        not in text.lower(),

        "Direct Vault path entered hosted Teller product source.",
    )


print(
    "TINT031-TINT040 HOSTED API SMOKE TEST PASSED"
)

print(
    "TINT040 Repair D: comment-aware hosted-probe verification passed"
)

print(
    "TINT040 Repair D: semantic Teller-only Tower boundary passed"
)

print(
    "Hosted runtime contract: present"
)

print(
    "HTTPS hosted origin policy: present"
)

print(
    "600-second token ceiling: present"
)

print(
    "Tower receipt claim: required"
)

print(
    "Liveness endpoint: present"
)

print(
    "Database/auth readiness endpoint: present"
)

print(
    "Tower token handoff contract: present"
)

print(
    "Render staging deployment specification: present"
)

print(
    "HTTPS browser API boundary: present"
)

print(
    "Hosted post-deploy probe: present"
)

print(
    "Executable hosted probe reads DATABASE_URL: NO"
)

print(
    "Browser database credentials: blocked"
)

print(
    "Teller modifies Tower in this pack: NO"
)

print(
    "Direct Vault: blocked"
)

print(
    "Hosted API deployed: no"
)

print(
    "Tower issuer connected: no"
)
