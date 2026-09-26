# Teller TINT081–090 — Exact Tower v2 Source-Crossing Proof

Source parent: `039f5cac87547034c8ae19e274161d3373cbabf8`.

Tower candidate: `c70d0327f56668f65d9f579d5259083c516c9db2`.

The cross-repository GitHub Actions job checks out this exact Tower v2 source and the current Teller candidate, runs Tower's v2 tests, issues one **synthetic** token through the real Python Tower issuer, and verifies it with Teller's actual JavaScript verifier. It checks issuer, audience, actor, business, session, receipt, 300-second lifetime and negative cases for signature tampering, issuer, audience, expiry and policy lifetime. No production tokens or signing secrets are needed.

This is **source-level compatibility**, not hosted deployment or HTTP/CORS/browser/DB proof. The synthetic test secret is deliberately not a deployed secret. No Render service, database, Teller static site, banking, payroll or Vault boundary is changed.

Current connected Render inventory inspected on 2026-09-26: Tower active deployment `1cfe40a385710c292f49ca2db20428605a1d5b43` (TWR192), Teller API active deployment `13b21ef5b39974c06857ca60bf8427fcf90435cc` (TINT031–040), Teller static active deployment `1b24db502bbf170b11c081b20b49b5640417b2e8`. All auto-deploy is off. This evidence requires refreshing before activation.

Deployment gate: exact Tower v2 hosted commit, exact-origin CORS and one-time exchange proof; Teller static build/branch verification; API health/auth/actor/business RLS proof; positive and negative browser crossings; then explicit deployment decision. Keep Tower as authority, Teller as workflow and Vault behind Tower.

## Verified source CI result

Exact candidate `dfa48e32716566be3488965ab6877949220bcaa9` passed [the cross-repository GitHub Actions workflow](https://github.com/LeeTheLilBee/The-Teller/actions/runs/36270460907). Tower source tests, the actual synthetic Tower issuer → Teller verifier, negative authorization cases, Teller pre-render regression and Vite build all passed. **Hosted deployment and live browser/API authorization remain unproven.**
