# The Teller — TINT031–TINT040
## Hosted Persistence API + Tower Token Handoff Contract

Teller's authenticated persistence API now has a deployment-ready hosted runtime contract.

This pack does not modify Tower and does not deploy the API.

## Hosted runtime

Supported runtime values:

- local
- staging
- production

Staging and production require HTTPS browser origins.

Wildcard browser origins are not part of the hosted Teller configuration.

## Liveness

`GET /healthz`

Liveness confirms the Teller persistence API process is running.

It does not expose:

- DATABASE_URL
- PostgreSQL credentials
- Teller/Tower signing secret

## Readiness

`GET /readyz`

Readiness checks:

- transport configuration
- signing-secret presence
- hosted origin validity
- PostgreSQL availability with `SELECT 1`

Render should use `/readyz` as the staging API health-check path.

## Token policy

Issuer:

`tower`

Audience:

`teller-persistence`

Maximum token lifetime:

600 seconds

Required authority claims include:

- Tower session ID
- Tower receipt ID
- actor ID
- actor role
- business key

The browser cannot declare these authorities independently.

## Tower handoff

This remains a Teller-side contract only.

Teller does not modify Tower in this pack.

The exact handoff artifact is:

`docs/teller/TOWER_HANDOFF_TELLER_PERSISTENCE_TOKEN_TINT031_040.md`

Tower work belongs in the Tower build lane.

## Render staging target

Workspace:

`Simplee World Staging`

New service:

`simplee-teller-api-staging`

Repository:

`LeeTheLilBee/The-Teller`

Branch:

`teller-tower-request-handoff-dev`

Region:

Virginia

Build:

`npm ci`

Start:

`npm run teller:api`

Health:

`/readyz`

Auto-deploy:

off

## Hosted API environment

Non-secret:

- TELLER_HOSTED_RUNTIME=staging
- TELLER_PERSISTENCE_ENABLED=true
- TELLER_DATABASE_SSL_MODE=require
- TELLER_DATABASE_POOL_MAX=5
- TELLER_DATABASE_STATEMENT_TIMEOUT_MS=15000
- TELLER_TRANSPORT_MAX_BODY_BYTES=524288
- TELLER_TRANSPORT_TOKEN_ISSUER=tower
- TELLER_TRANSPORT_TOKEN_AUDIENCE=teller-persistence
- TELLER_TRANSPORT_MAX_TOKEN_LIFETIME_SECONDS=600
- TELLER_ALLOWED_ORIGINS=https://simplee-teller.onrender.com,https://simplee-tower-ob.onrender.com

Secret:

- DATABASE_URL
- TELLER_TOWER_TOKEN_SECRET

The hosted API should use Render's INTERNAL staging PostgreSQL URL.

Neither secret belongs in browser code.

## Browser transport

Hosted Teller accepts HTTPS API URLs.

Plain HTTP is allowed only for loopback/local development.

The browser transport sends:

- Authorization bearer token
- no browser cookies
- no referrer

It never receives PostgreSQL credentials.

## Hosted probe

The post-deployment probe uses:

- TELLER_HOSTED_API_URL
- optional TELLER_HOSTED_ACCESS_TOKEN

The executable hosted probe does not read DATABASE_URL.

Its source comment may mention DATABASE_URL only to document that prohibition.

## TINT040 Repair D

The original TINT040 static wall falsely treated the phrase `DATABASE_URL` inside the hosted-probe security comment as executable database access.

Repair D strips JavaScript comments before inspecting the probe's executable source.

Repair D also verifies the Tower boundary positively instead of rejecting documentation that correctly says Teller does not modify Tower.

## Still inactive

- hosted Teller API not deployed
- Tower real token issuer not connected
- hosted browser persistence not active
- existing Teller static site not redeployed for this crossing
- direct Teller → Vault blocked
- OCR provider not connected
- payroll processor not connected
- payment processor not connected
- money movement not connected

## Next

1. Seal and push TINT031–TINT040.
2. Create `simplee-teller-api-staging`.
3. Configure its internal PostgreSQL URL.
4. Configure its staging Tower↔Teller signing secret.
5. Deploy.
6. Verify `/healthz`.
7. Verify `/readyz`.
8. Run hosted probe.
9. Send the separate Teller token-issuer handoff into the Tower build chat.

## Seal

TINT031–TINT040 was sealed from:

`d65bd271180ae6edfa27ea6209ac04a72424e07d`

Accepted repair:

- TINT040 Repair D

The hosted Teller API source contract is sealed, but no Render service deployment, database write, migration, Tower source change, or hosted browser activation occurred during this seal.

Next deployment target:

`simplee-teller-api-staging`

