# Teller ↔ Tower v2 Connection Readiness

Updated: 2026-09-28

## Current source candidate

Teller branch: `teller-tower-request-handoff-dev`

Teller candidate: `897fc898ada48e04cbab9ade1737ff04eee313a3`

Current Tower hosted branch: `tower-hosted-runtime-identity-twr081-085`

Current Tower source candidate tested by Teller: `26f695c06e77284c41000dcb49bb04a6c7433498`

The Teller development regression is green on the current Teller candidate.

The Teller cross-repository Tower v2 proof is also green against the exact current Tower source candidate. The proof executes the Tower Teller handoff/persistence security wall, issues a synthetic `tpt1` token through the real Tower issuer, verifies it with Teller's real verifier, checks negative authorization cases, preserves Teller pre-render fail-closed behavior, and builds Teller.

## Exchange contract

Production Teller starts fail closed and requires a fresh Tower launch before React mounts.

Tower launches Teller with an opaque one-time `tower_handoff` fragment.

Teller exchanges that code at:

`POST /tower/teller/exchange`

Production Teller requests:

`exchange_version = tower-teller-exchange.v2`

Required successful v2 fields:

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

The persistence bearer remains memory-only at:

`window.__TELLER_TOWER_SESSION__.persistence_access_token`

It is not placed in URL query parameters, the retained URL fragment, localStorage, sessionStorage, history state, logs, or browser database configuration.

## Current hosted truth

Teller's configured primary Tower endpoint is:

`https://simplee-tower-ob.onrender.com/tower/teller/exchange`

The primary `simplee-tower-ob` service is currently live on Tower commit:

`b106db5498d09ae292aa029dda4435c7b1cbfe3c`

The Tower Teller exchange, persistence-token issuer, and persistence-authority files on `b106db5` are byte-identical to the same files on tested Tower commit `26f695c`.

A second Tower service currently has `26f695c` live, but Teller remains configured to use the canonical primary URL above.

The Teller API service is live, but on older Teller commit:

`13b21ef5b39974c06857ca60bf8427fcf90435cc`

The Teller static site is also live on older Teller commit:

`1b24db502bbf170b11c081b20b49b5640417b2e8`

Therefore the source contract is connection-ready, while the complete hosted browser/API crossing is **not yet activated or certified**.

## Render values required for activation

Tower:

- `TOWER_TELLER_ALLOWED_ORIGIN=https://simplee-teller.onrender.com`
- `TELLER_TOWER_TOKEN_SECRET` must match the Teller API secret
- `TOWER_SESSION_SECRET` must remain configured for Tower handoff authority

Teller static build:

- `VITE_TOWER_TELLER_EXCHANGE_URL=https://simplee-tower-ob.onrender.com/tower/teller/exchange`
- `VITE_TELLER_PERSISTENCE_API_URL=https://simplee-teller-api-staging.onrender.com`

Teller API:

- `TELLER_TOWER_TOKEN_SECRET` must match Tower
- `DATABASE_URL` must be the intended Render internal database URL
- `TELLER_PERSISTENCE_ENABLED=true`
- allowed browser origins must include the Teller static origin

No signing secret or database credential belongs in the browser build.

## Activation sequence

1. Promote/deploy the current Teller candidate to the hosted Teller static site and Teller API.
2. Verify the Tower exact-origin and shared signing-secret configuration without exposing secret values.
3. Verify Teller API `/healthz` and `/readyz` against the deployed revision.
4. Launch Teller only from an authenticated, step-up-verified Tower owner session.
5. Prove one-time v2 exchange, CORS, memory-only bearer install, actor/business/session/receipt binding, and handoff replay denial.
6. Prove an authenticated Teller API read/write/search within the Tower-derived business scope.
7. Prove direct-open, expired, wrong-origin, wrong-version, tampered-token, and changed-scope cases fail closed.
8. Only then record hosted activation as ready.

## Boundary

This handoff does not authorize payroll execution, payment execution, brokerage/trading access, direct Vault access, or browser-held database/signing credentials.

Tower remains the identity/permission/launch authority. Teller remains the financial-administration workflow system.
