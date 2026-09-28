# Teller → Tower Connection Handoff — 2026-09-28

The Teller side is prepared for the protected Tower connection on `teller-tower-request-handoff-dev`.

## Canonical crossing

1. Tower launches Teller at `/teller#tower_handoff=<opaque-one-time-code>`.
2. Before React mounts, Teller POSTs the opaque code to the HTTPS endpoint configured by `VITE_TOWER_TELLER_EXCHANGE_URL`.
3. Teller requests exactly `tower-teller-exchange.v2`.
4. Tower validates the one-time handoff and returns the required authority fields plus a short-lived `tpt1` persistence bearer.
5. Teller validates the response, erases the launch fragment, installs the authority in `window.__TELLER_TOWER_SESSION__`, verifies that the persistence-capable live session is complete, and only then mounts React.
6. Teller API requests carry the short-lived bearer to the HTTPS base configured by `VITE_TELLER_PERSISTENCE_API_URL`.
7. Teller API independently verifies signature, issuer, audience, expiry, lifetime, role and Tower-derived scope; PostgreSQL RLS remains the second authorization wall.

## Current source alignment

Teller branch:

`teller-tower-request-handoff-dev`

Tower integration source used by Teller cross-repository proof:

`LeeTheLilBee/SimpleeMrkTrade@88af02c06bbcf0029ff12b6e16a38c68c58bf928`

Tower route:

`POST /tower/teller/exchange`

Exchange:

`tower-teller-exchange.v2`

## Tower must configure

- `TOWER_TELLER_ALLOWED_ORIGIN` = exact Teller browser origin.
- `TELLER_TOWER_TOKEN_SECRET` = high-entropy shared signing secret, at least 32 characters.
- Register the existing Teller handoff exchange in the hosted Tower runtime.
- Preserve exact v2 origin enforcement.
- Continue deriving actor ID, role, business key, Tower session ID and receipt ID from Tower authority only.

## Teller browser build must configure

- `VITE_TOWER_TELLER_EXCHANGE_URL` = HTTPS Tower `/tower/teller/exchange` URL.
- `VITE_TELLER_PERSISTENCE_API_URL` = HTTPS Teller API base URL.

## Teller API must configure

- `DATABASE_URL`
- `TELLER_TOWER_TOKEN_SECRET`
- `TELLER_TRANSPORT_TOKEN_ISSUER=tower`
- `TELLER_TRANSPORT_TOKEN_AUDIENCE=teller-persistence`
- `TELLER_TRANSPORT_MAX_TOKEN_LIFETIME_SECONDS=600` or less
- `TELLER_ALLOWED_ORIGINS` containing the exact Teller browser origin

The signing secret and database credentials must never be injected into browser code.

## Required v2 response fields

`exchange_version`, `access_verified`, `app_id`, `role`, `target_path`, `receipt_id`, `expires_at_epoch`, `navigation_context`, `tower_session_id`, `actor_id`, `business_key`, `persistence_access_token`.

Expected values include:

- `exchange_version=tower-teller-exchange.v2`
- `access_verified=true`
- `app_id=teller`
- `target_path=/teller`
- role in `employee | manager | owner`

## Fail-closed requirements already enforced by Teller

- No production direct-open without a fresh Tower handoff.
- No React application mount before verified v2 exchange.
- No persistence activation from query parameters or browser storage.
- No persistence token in URL, history state, localStorage or sessionStorage.
- Expired sessions unmount and lock the workspace.
- Reload requires a fresh Tower launch because the bearer is memory-only.
- Teller rejects malformed navigation context, wrong app/path/version, unsupported role, missing authority fields or expired authority.

## Validation

The Teller repository now runs:

- Teller development regression.
- Hosted crossing regression.
- Tower v2 cross-repository proof against the exact Tower integration-desk revision above.
- Tower-issued synthetic token → Teller verifier compatibility proof.
- Production build.

This handoff authorizes source integration testing only. It does not activate payroll execution, payment movement, Vault direct access, broker execution, Manual Live, Live Auto, real employee traffic or production money movement.
