
# The Teller — TINT041–TINT050

## Hosted Browser Activation Gate + Tower Session Integrity

Parent:

`13b21ef5b39974c06857ca60bf8427fcf90435cc`

This pack prepares the Teller browser for authenticated hosted persistence without pretending that the real hosted Tower → Teller crossing is already solved.

## What changed

The Teller persistence transport now has an explicit activation gate.

Hosted persistence requires all of the following:

- a LIVE Tower window-injected session
- Tower session ID
- Tower receipt ID
- actor ID
- authorized Teller role
- business key
- HTTPS Teller persistence API URL
- a short-lived `tpt1` persistence access token

A session that exists only through Teller's historical session-storage UI fallback cannot activate durable persistence.

The ordinary Teller UI fallback remains available for compatibility, but it is not trusted as sufficient persistence authority.

## Identity safety

The persistence transport identity now binds:

- Tower session
- Tower receipt
- actor
- business
- Teller role

If the Tower identity or business changes while Teller is open, Teller clears the old in-memory record set before the new authenticated hydration can proceed.

This prevents records from one Tower identity/business from remaining visible after a session switch.

## Browser boundaries

The browser still receives no:

- `DATABASE_URL`
- PostgreSQL credentials
- signing secret
- direct Vault path

The persistence token is not read from:

- query parameters
- localStorage
- sessionStorage

## Hosted activation

Prepared API:

`https://simplee-teller-api-staging.onrender.com`

Prepared static site:

`https://simplee-teller.onrender.com`

Future build-time variable:

`VITE_TELLER_PERSISTENCE_API_URL=https://simplee-teller-api-staging.onrender.com`

That variable is NOT activated by this pack.

## Cross-origin truth

Tower and Teller are hosted on separate origins.

This pack does not invent an insecure way to move the persistence token between those origins.

Current sealed Teller token contract still expects the token from the live Tower session object.

If the real Tower hosted launch cannot provide that live session object securely, the Tower work must return a concrete bootstrap/exchange requirement to Teller.

Teller must not solve that problem by putting the persistence token into a URL or browser storage.

## Current state

- hosted Teller API: already live staging
- hosted browser activation gate: built
- Tower token issuer: not connected
- cross-origin exchange: not built
- Teller static persistence activation: not performed
- database work in this pack: none
- deploy in this pack: none
- direct Teller → Vault: blocked

## Next gate

Prove the real hosted Tower → Teller session/token crossing.

Only after that proof should the Teller static site's hosted API build variable be activated.

## Seal

TINT041–TINT050 was sealed from:

`13b21ef5b39974c06857ca60bf8427fcf90435cc`

Sealed at:

`2026-09-21T13:46:58.350801+00:00`

No Tower source modification, hosted static activation, database work, Vault integration, Render mutation, or deployment occurred during this seal.

The next gate remains the real hosted Tower → Teller session/token crossing.

