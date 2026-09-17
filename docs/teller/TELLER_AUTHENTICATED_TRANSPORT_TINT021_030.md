# The Teller — TINT021–TINT030
## Authenticated Persistence Transport + App Hydration

Teller now has a real authenticated transport layer between its browser client and PostgreSQL.

## Live proof

- Record: teller_transport_proof_0b1a48ba78494c93a3
- Business: simplee_world_staging
- Actor: manager_transport_a_0b1a48ba78494c93a3

## TINT023 Repair A

Migration 001 already forced PostgreSQL Row Level Security.

The initial Migration 002 attempt could not see historical rows while backfilling actor identity.

Repair A temporarily disables FORCE for the table owner inside the migration transaction, backfills historical records as `legacy_unknown`, makes actor_id NOT NULL, and restores FORCE before commit.

Live verification proved:

- missing actor IDs: 0
- historical records backfilled: 1
- actor_id NOT NULL: yes
- record RLS enabled and forced: yes
- event RLS enabled and forced: yes

## TINT023 Repair A.1

The first repair verifier searched for `FORCE ROW LEVEL SECURITY` and accidentally matched that substring inside `NO FORCE ROW LEVEL SECURITY`.

The verifier was corrected to inspect the exact ALTER TABLE clauses and their ordering.

## TINT030 Repair B

The runtime token reader contains an explanatory comment saying that Teller does not use localStorage or sessionStorage for persistence access tokens.

The original static security wall searched raw source text and treated the word `sessionStorage` inside that comment as executable behavior.

Repair B strips JavaScript comments before inspecting the executable token-reader source.

The corrected check proves the executable token reader:

- reads from `window.__TELLER_TOWER_SESSION__`
- does not read sessionStorage
- does not read localStorage
- does not read URL query parameters
- does not call the normal stored-session reader

## Signed persistence authorization

The browser never receives PostgreSQL credentials.

The browser receives a short-lived signed persistence access token.

The Teller server verifies:

- signature
- issuer
- audience
- issued-at time
- expiry
- maximum token lifetime
- actor ID
- actor role
- business key
- Tower session ID

The database scope is derived from verified claims instead of request-body authority.

## Current database visibility

Owner:
- authorized business records

Manager:
- own records

Employee:
- own records

Manager/team delegation is intentionally not inferred yet.

Audit-event visibility follows the parent record.

## Live authenticated transport proof

The staging integration passed:

- anonymous request blocking
- tampered-token blocking
- disallowed-origin blocking
- authenticated durable record write
- idempotent HTTP replay
- same-business actor isolation
- owner business visibility
- request-body scope-escalation blocking
- complete API/Postgres-pool shutdown
- fresh API/Postgres-pool durable reload

## App source

Teller App now has source wiring for:

Tower-injected persistence token
→ browser persistence transport
→ authenticated Teller HTTP API
→ verified authorization claims
→ PostgreSQL transaction scope
→ forced RLS
→ durable record

Durable records can hydrate back into the Records workspace after reload.

Prepared records can also persist through that authenticated path.

## Still inactive

Tower is not yet issuing the real persistence token.

The Teller persistence API has not been hosted yet.

Therefore the real hosted browser path remains inactive.

Vault, OCR, payroll processors, payment processors, and money movement remain disconnected.

## Next

TINT031–TINT040 — Hosted Persistence API + Tower Token Handoff.

## TINT030 Repair C

The final direct-Vault boundary audit originally scanned the regression test itself.

That regression test intentionally contains the forbidden literal `vault://` so it can assert that executable Teller product source does not contain a direct Vault URI.

The outer audit treated that negative fixture as product behavior.

Repair C separates product-source inspection from negative test fixtures.

Final verified result:

- direct Vault URI in Teller product source: no
- direct Vault URI in browser transport: no
- direct Vault URI in server transport: no
- direct Vault URI in App/runtime source: no
- `vault://` literal in negative regression fixture: allowed only as a guard value

Teller → Vault direct access remains blocked.

## Seal

TINT021–TINT030 was sealed from:

`b8b3d22ce2baebd48f17d8f9daf454ae9b36ed4b`

Live authenticated transport proof:

`teller_transport_proof_0b1a48ba78494c93a3`

Accepted repairs:

- TINT023 Repair A
- TINT023 Repair A.1
- TINT030 Repair B
- TINT030 Repair C

No migration rerun, additional database write, new certification record, or application deployment occurred during the seal.

