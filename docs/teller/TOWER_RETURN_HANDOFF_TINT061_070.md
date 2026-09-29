
# TELLER → TOWER RETURN HANDOFF

## TINT061–TINT070
## Pre-Render Tower Launch Bootstrap + Explicit Exchange Versioning

Parent Teller checkpoint:

`8eba601d137fac7c8e13f55a054c5bbf0cb4b772`

Do not deploy Teller yet.

## Startup correction

Production Teller now performs:

`src/main.jsx`

→ pre-mount opening surface

→ await secure Tower bootstrap

→ exchange opaque `tower_handoff`

→ validate Tower response

→ install live `window.__TELLER_TOWER_SESSION__`

→ verify persistence-capable live session

→ sanitize the one-time launch fragment

→ only then mount React

Failed production Tower bootstrap does not mount the React Teller application.

## Bootstrap ownership

Network/security launch orchestration no longer lives in:

`src/App.jsx`

It now lives in:

`src/teller/tellerPreRenderBootstrap.js`

Lower-level secure exchange remains:

`src/teller/towerAccess.js`

## Explicit exchange versions

Historical low-level exchange:

`tower-teller-exchange.v1`

Status:

PRESERVED.

Teller does not silently redefine v1.

Persistence-capable pre-render exchange:

`tower-teller-exchange.v2`

Production Teller explicitly requests:

`exchange_version = tower-teller-exchange.v2`

Tower must return exactly:

`exchange_version = tower-teller-exchange.v2`

A v1 response cannot satisfy the production v2 pre-render request.

## Required Tower v2 response

- `exchange_version`
- `access_verified`
- `app_id`
- `role`
- `target_path`
- `receipt_id`
- `expires_at_epoch`
- `navigation_context`
- `tower_session_id`
- `actor_id`
- `business_key`
- `persistence_access_token`

The sealed Teller `tpt1` persistence-token contract is unchanged.

## Persistence credential

`persistence_access_token`

remains memory-only at:

`window.__TELLER_TOWER_SESSION__.persistence_access_token`

It is not written to:

- query parameters
- URL fragments
- localStorage
- sessionStorage
- history state
- React bootstrap state
- logs

Browser never receives:

`TELLER_TOWER_TOKEN_SECRET`

## Direct open / reload

Hosted production Teller without a fresh Tower handoff fails closed.

Reload destroys the memory-only persistence credential.

Fresh Tower authorization is required.

## Development

Local Vite DEV mode retains UI-only access.

That path grants no persistence bearer.

## Tower next action

Implement and prove:

`tower-teller-exchange.v2`

on the existing:

`POST /tower/teller/exchange`

route.

Preserve historical v1.

Do not activate Teller static hosting against persistence until the Tower v2 crossing is proven.

## Teller Seal

TINT061–TINT070 was sealed from:

`8eba601d137fac7c8e13f55a054c5bbf0cb4b772`

Sealed at:

`2026-09-24T14:04:18.511916+00:00`

This seal preserves:

- historical `tower-teller-exchange.v1`
- explicit persistence-capable `tower-teller-exchange.v2`
- Tower bootstrap before React mount
- fail-closed production direct-open behavior
- memory-only persistence bearer handling

No Tower source, database, Render service, Teller static deployment, Vault path, or money rail was changed during this seal.

The exact resulting Teller commit SHA is emitted by the seal process after commit and push.

