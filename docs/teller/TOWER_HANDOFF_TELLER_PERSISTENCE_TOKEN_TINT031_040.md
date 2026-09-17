# The Teller → Tower Handoff
## Persistence Access Token Contract
## TINT031–TINT040

This document is a Teller-side handoff.

It does not implement or modify Tower.

Tower remains the authority for identity, role, business/entity access, session validity, step-up, and security receipts.

## What Teller needs from Tower

For every hosted Teller session that is allowed to use durable persistence, Tower must issue a short-lived persistence access token.

The token must contain:

- `iss`
- `aud`
- `iat`
- `exp`
- `jti`
- `tower_session_id`
- `tower_receipt_id`
- `actor_id`
- `actor_role`
- `business_key`

Issuer:

`tower`

Audience:

`teller-persistence`

Maximum lifetime:

600 seconds.

Allowed actor roles:

- employee
- manager
- owner

## Injection point

Tower must place the token only in the live Teller session object:

`window.__TELLER_TOWER_SESSION__.persistence_access_token`

Tower must not send this token in:

- query parameters
- localStorage
- sessionStorage
- URL fragments

Teller does not persist the access token.

## Authority boundary

The browser does not get to declare:

- its business
- its actor identity
- its role
- its Tower session

Those values come from verified signed claims.

The Teller HTTP API derives PostgreSQL scope from the verified claims.

PostgreSQL Row Level Security is the second authorization wall.

## Current record visibility

Owner:

- authorized business records

Manager:

- own records

Employee:

- own records

Manager/team delegation is intentionally deferred until there is an explicit authorization model.

## Shared staging secret

The current staging contract uses HMAC-SHA256.

The secret environment variable is:

`TELLER_TOWER_TOKEN_SECRET`

The secret value must never be placed in source control or browser code.

Tower and the Teller API may know the staging signing secret.

The browser must never know it.

A future production hardening pass may replace this shared-secret signature boundary with asymmetric signing so only Tower holds token-signing authority.

## Teller API endpoints

Public liveness:

`GET /healthz`

Public readiness:

`GET /readyz`

Authenticated durable record endpoints:

- `GET /v1/records`
- `POST /v1/records`
- `GET /v1/records/:record_id`
- `PATCH /v1/records/:record_id`

## Teller-side result

Once Tower satisfies this contract:

Tower
→ injects short-lived persistence token
→ Teller browser
→ authenticated Teller API
→ verified Tower claims
→ scoped PostgreSQL transaction
→ forced RLS
→ durable Teller records

Vault remains separate and Tower-mediated.
