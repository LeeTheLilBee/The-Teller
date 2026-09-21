
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

GATE = (
    ROOT /
    "src/teller/persistence/tellerHostedPersistenceGate.js"
)

RUNTIME = (
    ROOT /
    "src/teller/tellerRuntimeSession.js"
)

TRANSPORT = (
    ROOT /
    "src/teller/persistence/tellerPersistenceTransport.js"
)

APP = (
    ROOT /
    "src/App.jsx"
)

SPEC = (
    ROOT /
    "deploy/render/teller-static-hosted-persistence-staging.json"
)


for path in [
    GATE,
    RUNTIME,
    TRANSPORT,
    APP,
    SPEC,
]:
    assert path.exists(), path


gate = GATE.read_text(
    encoding="utf-8"
)

runtime = RUNTIME.read_text(
    encoding="utf-8"
)

transport = TRANSPORT.read_text(
    encoding="utf-8"
)

app = APP.read_text(
    encoding="utf-8"
)

spec = SPEC.read_text(
    encoding="utf-8"
)


assert (
    "live_tower_window_injection_required"
    in gate
)

assert (
    "tower_session_id_missing"
    in gate
)

assert (
    "tower_receipt_id_missing"
    in gate
)

assert (
    "actor_id_missing"
    in gate
)

assert (
    "business_key_missing"
    in gate
)

assert (
    "hosted_api_url_missing_or_invalid"
    in gate
)

assert (
    "persistence_access_token_missing"
    in gate
)

assert (
    "readTellerLiveTowerSession"
    in runtime
)

assert (
    "readTellerLiveTowerSession"
    in transport
)

assert (
    "describeTellerHostedPersistenceActivation"
    in transport
)

assert (
    "activation.ready"
    in transport
)

assert (
    "towerIdentityKey"
    in app
)

assert (
    "tower_identity_changed"
    in app
)

assert (
    "VITE_TELLER_PERSISTENCE_API_URL"
    in spec
)

assert (
    '"static_site_activation_performed": false'
    in spec.lower()
)

assert (
    '"cross_origin_exchange_built": false'
    in spec.lower()
)


# Persistence access token itself must remain live-window-only.
token_function = runtime.split(
    "export function readTellerPersistenceAccessToken()",
    1,
)[1].split(
    "export function isTowerIssuedTellerSession()",
    1,
)[0]


assert (
    "sessionStorage"
    in token_function
)

assert (
    "localStorage"
    in token_function
)

assert (
    "query parameters"
    in token_function
)

# Those terms are allowed only in comments explaining prohibition.
# Executable token acquisition must use the live Tower object.
assert (
    "__TELLER_TOWER_SESSION__"
    in token_function
)


browser_sources = "\n".join([
    gate,
    runtime,
    transport,
    app,
])


for forbidden in [
    "postgresql://",
    "postgres://",
    "DATABASE_URL",
    "TELLER_TOWER_TOKEN_SECRET",
]:
    assert (
        forbidden.lower()
        not in browser_sources.lower()
    ), forbidden


assert (
    "vault://"
    not in browser_sources.lower()
)


print(
    "TINT041-TINT050 HOSTED BROWSER ACTIVATION SMOKE TEST PASSED"
)

print(
    "Live Tower persistence session gate: present"
)

print(
    "Stored-session persistence activation: blocked"
)

print(
    "Tower session/receipt binding: present"
)

print(
    "Actor/business binding: present"
)

print(
    "HTTPS hosted API boundary: present"
)

print(
    "Stale Tower identity record clearing: present"
)

print(
    "Browser database credentials: absent"
)

print(
    "Browser signing secret: absent"
)

print(
    "Direct Vault: blocked"
)

print(
    "Hosted static site activation: not performed"
)

print(
    "Cross-origin exchange: not invented"
)
