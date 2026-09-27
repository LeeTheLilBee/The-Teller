# TINT111–TINT120 — Truthful Records & Authenticated Search

Base Teller checkpoint: `f1624712b4359c8c1ae2e4d30b8f21cb76810235`.

## User-visible correction

The old Records card displayed “Session record” and “Production persisted: No” for every item, even after the authenticated database had returned a serialized durable record. Its repository status also defaulted to “Not connected,” regardless of App's actual API hydration result. Its search covered only the first 100 records loaded into session memory.

This candidate makes record-level truth derive from **both** the authenticated API serializer's `persistence.production_persisted` and `persistence.production_repository_connected` flags and a positive `persistence_revision`. No URL, role, browser setting or user-input status is itself treated as persistence proof. The UI connection state becomes Checking → Verified only on actual authenticated hydration success, or Unavailable on failure. DEV/session-only records remain unconfirmed.

An explicit **Search authenticated records** action sends text/category/status through the existing Teller bearer transport, while the server applies Tower-derived business RLS. The response is capped at 100; the UI says so instead of implying an exhaustive listing. Search text is only safe indexed record metadata, not protected payload values. On filter changes, closure or Tower-scope changes, stale results do not overwrite the current view. When the repository is unavailable, local loaded-record filtering stays available and is not represented as authenticated remote search.

## Verification

- `tools/teller_records_truth_contract_tint111_120.mjs`: record and connection truth.
- `tools/teller_records_truth_smoke_tint111_120.py`: UI/API structural boundary.
- Existing Teller bootstrap, expiry, durable acknowledgement and practical use tests + Vite production build remain mandatory.

This is source work only until CI confirms it. No Render mutation or payment/payroll execution.

## Hosted release hold

Render read-only inventory on 2026-09-27 found an old Tower URL `https://simplee-tower-ob.onrender.com` in staging and a separate newer Tower service `https://simplee-tower-ob-tunv.onrender.com` in a different workspace. Teller's historical static spec still names the older URL. The [Tower runtime acceptance issue](https://github.com/LeeTheLilBee/SimpleeMrkTrade/issues/25) tracks selection and exact owner-authenticated v2 crossing proof. Do not silently swap hostnames or activate Teller static persistence without that evidence.
