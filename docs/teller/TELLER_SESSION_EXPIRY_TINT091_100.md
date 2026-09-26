# TINT091–TINT100 — Live Tower Session Expiry Boundary

Source parent: `620a2c7af35272b333fca6c9bde3cf5f347ba742`.

The Tower v2 issuer returns a persistence bearer with a short lifetime (normally 300 seconds, maximum 600 seconds), and the v2 response `expires_at_epoch` reflects the token's shorter expiry. Teller must not keep presenting the protected workspace or issuing requests with a captured bearer after expiry.

## Source changes

- The live Tower-session reader and persistence-token reader refuse expired sessions.
- Historical `sessionStorage` UI fallback is DEV-only; it does not revive production identity.
- The authenticated persistence transport re-checks the current live session and unchanged token and identity **at every request**, denying stale/expired/lost sessions before fetch. The Teller server remains the cryptographic issuer/audience/expiry/RLS verifier.
- The production pre-render launch checks for future session expiry before React mounts.
- The mounted React workspace is unmounted at expiry and replaced with a non-React locked surface. Old live memory is cleared where possible.
- DEV UI-only entry still has no persistence authority.

## Scope and UX

Teller does not silently refresh a one-time handoff or store tokens to survive reload. A fresh Tower-authorized launch is required after expiry. This currently limits a hosted Teller session to Tower's issued lifetime; longer-session UX or a separately authorized renewal contract must be designed with Tower, not invented within Teller.

## Verification and rollout

Run `tools/teller_session_expiry_contract_tint091_100.mjs` with existing TINT041/TINT051/TINT061/TINT071 regression contracts, the structural Python smoke suite, and the production Vite build in Actions.

This pack is a source candidate until CI confirms it. It does not deploy Tower/Teller or modify DB, Render, Vault, payroll, payments or broker execution. The live Tower revision and hosted v2 crossing remain independent release gates.
