# TINT121–130 — Hosted Teller Release Identity

Teller needs to prove the exact source revision running on the hosted persistence API before hosted activation can be certified.

This pack adds a safe release identity summary to `/versionz`, `/healthz`, and `/readyz`.

The summary may expose the Git revision, branch, API contract, Tower exchange contract, and persistence-token contract. It must never expose the Tower/Teller signing secret, database credentials, bearer tokens, or raw environment data.

Revision resolution prefers `TELLER_SOURCE_REVISION` and falls back to `RENDER_GIT_COMMIT`. Branch resolution prefers `TELLER_SOURCE_BRANCH` and falls back to `RENDER_GIT_BRANCH`. Missing or unsafe metadata is reported as absent instead of guessed.

The new endpoint uses the same exact-origin gate as the rest of the hosted API. This pack performs no Render mutation and no deployment. It exists so a later deployment can be verified against an exact source revision rather than inferred from the dashboard.
