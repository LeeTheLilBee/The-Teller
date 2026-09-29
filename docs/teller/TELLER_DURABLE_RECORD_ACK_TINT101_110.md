# TINT101–TINT110 — Durable record acknowledgement

Base Teller commit: `a9b43effbfb8d4be06619379b6710738a8496a44`.

## Practical correction

The previous App inserted a prepared record into the visible session list before the authenticated persistence API replied. If the save failed, the user still saw a record that appeared prepared, while the Forms workspace had already closed its draft. This is unsafe for real administrative work.

This source candidate changes that order: validate → duplicate/pending/scope gate → authenticated save → matching server acknowledgement → accept into UI → mark the form prepared. On an ambiguous or failed request, no durable record is claimed, the draft stays open, and retry is possible under the API's idempotent record_id handling. DEV UI-only preparation remains explicitly session-only, not a production record.

The pure helper is `src/teller/records/tellerDurablePreparation.js`. It also fails closed if an authenticated Tower session lacks a connected persistence API, suppresses in-flight duplicate record IDs, refuses to insert late results from a changed actor/business, and reconciles a concurrent hydration response against already acknowledged records. Hosted recovery cannot substitute a browser snapshot for authenticated repository hydration.

The form renderer presents a non-sensitive retry message and disables repeated submit while awaiting acknowledgement. It never exposes a persistence bearer or signing secret.

## Verification

`tools/teller_durable_preparation_contract_tint101_110.mjs` exercises success, failed save, missing repository, wrong acknowledgement, changed scope, duplicate submission, local-only behavior and hydration reconciliation. The form structural smoke and historical Teller CI/build run on the development PR. The source checks are not hosted or database proof.

## Hosted truth (read-only Render inspection, 2026-09-27)

- Teller API live: `13b21ef5b39974c06857ca60bf8427fcf90435cc`.
- Teller static live: `1b24db502bbf170b11c081b20b49b5640417b2e8` (old main branch).
- Tower live: `1cfe40a385710c292f49ca2db20428605a1d5b43` (TWR192, before v2).

The current source candidate is not deployed. Tower v2 source exists but still requires hosted release verification. No Render mutation, paid resource, banking/payroll execution or direct Teller → Vault was authorized by this pack.

## Next gate

Obtain passing GitHub Actions for this candidate, review and merge into Teller development, then coordinate Tower v2 hosted deployment and real end-to-end owner launch/API RLS proof before changing Teller static hosting. Keep all deployment claims separate from source-only checks.
