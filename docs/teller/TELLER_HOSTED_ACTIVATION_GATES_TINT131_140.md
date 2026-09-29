# TINT131–140 — Teller hosted activation source gates

Verified against source branch `teller-hosted-activation-gates-tint131-140` based on Teller `7a17e2f8c29254a1cb5381c9930645dc08c4e894`.

## Render observations — 2026-09-29

The live canonical **secondary Tower** is `https://simplee-tower-ob-tunv.onrender.com`, Render service `srv-dag3sv2jnfac73bjqj8g`, deployed from exact Tower source `3db5fbc15f4a59c4ba1eeaf5bea32e8377f355c1`. The older `https://simplee-tower-ob.onrender.com` is **not** the Teller integration target.

The Teller API staging service `srv-dam18bu7bikc73fut6t0` remains live on older Teller commit `13b21ef5b39974c06857ca60bf8427fcf90435cc`. The Teller static site `srv-dak0ntbm8hqs73a1564g` remains live on older Teller commit `1b24db502bbf170b11c081b20b49b5640417b2e8`. Both services have auto-deploy disabled.

These are dated external observations, NOT activation claims. GitHub source success is not a hosted browser/API crossing.

## What this pack changes

- Align the active pre-render static build spec with the already canonicalized secondary Tower URL.
- Make the Teller cross-repository source regression check the **exact source revision deployed on canonical Tower** at this checkpoint; when Tower redeploys, refresh and re-prove this pin before activation.
- Enforce source configuration alignment with an executable test in the Teller development regression.
- Preserve explicit source-only/activation-hold fields. No secrets, Render env values, real tokens or deployment are written.

## Required controlled activation proof (not yet completed)

1. Confirm Tower and Teller API securely share the actual `TELLER_TOWER_TOKEN_SECRET` without revealing its value. Check exact-origin CORS with the canonical secondary Tower.
2. Confirm the currently deployed Tower revision still equals the pinned proof revision; rerun the cross-repository security regression on any Tower deployment change.
3. Deploy Teller API staging from the accepted Teller commit and verify `/versionz`, `/healthz`, `/readyz` and actual DB readiness on the new revision.
4. Configure the Teller static build with **only** the two public `VITE_*` URLs from the active static spec; deploy the accepted candidate in a controlled activation window.
5. Use a genuine Tower-authenticated owner launch to prove fresh one-time v2 handoff, replay denial, memory-only credential handling, API read/write/search and Tower-derived business scope.
6. Prove direct-open, wrong-origin, wrong-version, expired, tampered or changed-scope negative cases.
7. Record actual deployed source SHA and proof evidence before declaring hosted activation.

No independent payroll/payment processing, money movement, broker authority, or direct Teller → Vault access is granted here. Do not replace an existing hosted service or change any secret merely because the source gate is green.
