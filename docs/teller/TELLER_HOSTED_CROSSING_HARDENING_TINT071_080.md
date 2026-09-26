# Teller TINT071–080 — Hosted Crossing Hardening

Parent Teller source: `fd430134295167c6ee10e8c2d27a59592fa5d353`.

Tower v2 source candidate inspected: `c70d0327f56668f65d9f579d5259083c516c9db2`. The presence of source is **not** hosted proof.

## Security issue corrected

TINT061 accepted a pre-existing, shape-valid `window.__TELLER_TOWER_SESSION__` as sufficient to skip a new Tower v2 exchange before React mount. A browser-memory object is not Tower authorization. It also could remain accessible after an unsuccessful exchange.

Teller now discards any previous live window session at pre-render entry. Production startup always requires a fresh one-time `tower_handoff`, and a successful `tower-teller-exchange.v2` response. If old memory cannot be cleared, startup fails closed without making a request or mounting React. The development UI-only path also clears any old persistence credential.

The Teller API remains the cryptographic verifier of `tpt1`. Teller does not embed or derive Tower's signing secret. Roles, actor, business, receipt and session authority remain Tower-owned. v1 compatibility and owner-only hosted launch scope are unchanged.

## Test coverage

`tools/teller_pre_render_bootstrap_security_tint071_080.mjs` exercises no-handoff stale session, fresh handoff replacing stale authority, v1-to-v2 mismatch, rejected exchange, DEV UI-only clearing and non-configurable stale state. Existing TINT051/TINT061 contracts must also pass.

## Release truth

This is a source candidate. CI/build, Tower hosted v2 proof, Teller static deployment, real persistence crossing and payments/payroll execution are **not** certified by merely creating the branch. Do not enable static hosting until exact end-to-end authorization and origin/CORS checks are proven. No direct Teller → Vault path.
