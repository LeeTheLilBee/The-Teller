
# TELLER → TOWER RETURN HANDOFF

## TINT051–TINT060
## Secure Hosted Tower Bootstrap Receiver

Parent Teller checkpoint:

`fe3acae32ed02987439eeef5fed9b21b2afab725`

Teller has implemented the receiver required by Tower's hosted-crossing inspection.

Do not deploy Teller yet.

## Exact Teller bootstrap files

Primary hosted receiver:

`src/teller/towerAccess.js`

Application bootstrap gate:

`src/App.jsx`

Existing live session reader preserved:

`src/teller/tellerRuntimeSession.js`

Existing persistence transport preserved:

`src/teller/persistence/tellerPersistenceTransport.js`

Existing TINT041 activation gate preserved:

`src/teller/persistence/tellerHostedPersistenceGate.js`

Machine-readable exchange contract:

`contracts/teller/teller_hosted_bootstrap_contract_v1.json`

## Existing exchange reused

Teller reads only the opaque one-time code:

`tower_handoff`

from the launch fragment.

Teller sends it through:

`POST /tower/teller/exchange`

configured by:

`VITE_TOWER_TELLER_EXCHANGE_URL`

The one-time code is NOT the Teller persistence bearer token.

## Exact new Tower response field

Tower must add:

`persistence_access_token`

to the successful existing exchange response.

The value must be the already-signed short-lived:

`tpt1.<payload>.<signature>`

credential defined by the sealed Teller persistence-token contract.

## Exact additional session authority fields Teller requires

Besides the existing exchange fields, Teller requires Tower to return:

`tower_session_id`

`actor_id`

`business_key`

`persistence_access_token`

Teller continues using these existing Tower exchange fields:

`exchange_version`

`access_verified`

`app_id`

`role`

`target_path`

`receipt_id`

`expires_at_epoch`

`navigation_context`

Mapping into the live Teller session is:

`response.role`
→ `window.__TELLER_TOWER_SESSION__.role`

`response.tower_session_id`
→ `window.__TELLER_TOWER_SESSION__.tower_session_id`

`response.receipt_id`
→ `window.__TELLER_TOWER_SESSION__.tower_receipt_id`

`response.actor_id`
→ `window.__TELLER_TOWER_SESSION__.actor.id`

`response.business_key`
→ `window.__TELLER_TOWER_SESSION__.business.key`

`response.persistence_access_token`
→ `window.__TELLER_TOWER_SESSION__.persistence_access_token`

## Memory-only proof

The persistence bearer token is not returned from Teller's bootstrap function.

The returned React bootstrap result contains no token.

The bearer token is not written to:

- query parameters
- URL fragments
- localStorage
- sessionStorage
- history state
- static/public HTML
- logs

The only browser location holding it is the live in-memory object:

`window.__TELLER_TOWER_SESSION__.persistence_access_token`

## Fragment cleanup

After the successful Tower response has passed Teller validation, Teller removes the one-time launch fragment with:

`history.replaceState(null, "", pathname + search)`

No token enters history state.

## Reload behavior

The persistence credential is intentionally not recoverable after page reload.

A reload requires a fresh Tower-authorized launch/exchange if durable authenticated persistence is needed again.

## App gating

The Teller application now waits for the hosted Tower bootstrap to complete when the one-time handoff is present.

If the handoff exchange fails or its response is invalid, Teller fails closed.

The hosted persistence transport is not constructed until a live Tower window session exists.

A historical Teller UI-only session from sessionStorage cannot activate durable persistence.

## Tower next action

Tower may now extend the successful existing exchange response with the exact fields above.

Tower must derive:

- actor ID
- role
- business key
- Tower session ID
- receipt ID

from Tower authority only.

The browser must never receive:

`TELLER_TOWER_TOKEN_SECRET`

Do not change the existing `tpt1` persistence-token contract.

After Tower proves the full crossing, return the hosted proof to Teller.

Only then should Teller activate the static site's hosted persistence configuration.

## TINT060 Repair A — Existing Hosted Handoff Hardening Preserved

Before seal, Teller compared the restored hosted bootstrap receiver against the earlier deployed Tower handoff layer.

Two existing protections were restored:

- Hosted navigation destinations remain explicitly allowlisted.
- Legacy `tower_clearance` and `teller_view` query values are removed when a successful Tower launch is sanitized.

Current accepted destinations for the existing hosted owner crossing are:

- `owner_money_workspace`
- `payroll_review`

This repair does not change the persistence-token contract.

`persistence_access_token` remains memory-only and is still never written to browser storage, URLs, history state, React bootstrap state, or logs.

## Teller Seal

TINT051–TINT060 was sealed from:

`fe3acae32ed02987439eeef5fed9b21b2afab725`

Sealed at:

`2026-09-21T14:21:30.698465+00:00`

Accepted repair:

`TINT060-REPAIR-A`

The exact resulting Teller commit SHA is recorded by the seal process after commit and push.

No Tower source, database, Render service, static Teller deployment, Vault path, or production money rail was changed during this Teller seal.

