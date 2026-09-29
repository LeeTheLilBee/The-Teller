# The Teller — TINT001–TINT010
## Production Persistence Foundation

This pack begins the Teller Real Integration lane.

It replaces the idea of "we need a database later" with an actual PostgreSQL persistence architecture in the repository.

## What now exists

### PostgreSQL configuration

Teller has a fail-closed server configuration boundary using:

- `TELLER_PERSISTENCE_ENABLED`
- `DATABASE_URL`
- `TELLER_DATABASE_SSL_MODE`
- `TELLER_DATABASE_POOL_MAX`
- `TELLER_DATABASE_STATEMENT_TIMEOUT_MS`

A database URL is never printed by the safe configuration summary.

### Durable record schema

`teller_records` stores:

- business key
- Teller record ID
- schema version
- persistence revision
- source/source ID
- form/workflow/category
- title
- actor role
- workflow status
- sanitized payload JSON
- safe search projection
- integrity metadata
- submission fingerprint
- idempotency key
- safe search text
- created/updated timestamps

### Business isolation

Every durable record is scoped by `business_key`.

PostgreSQL Row Level Security is enabled and forced.

The server transaction must install a Tower-authorized business key before Teller record rows are readable or writable.

### Idempotency

Durable creates require a business-scoped idempotency key.

Replaying the same create does not create a second durable record.

### Revision protection

Updates use an expected revision.

If another write changed the record first, Teller returns a conflict instead of silently overwriting the newer record.

### Search

Server search uses safe metadata only.

Raw workflow payload data is not searched.

### Audit history

Record history events have their own durable table.

History writes are business-scoped and idempotent.

### PostgreSQL repository

The real server adapter now supports:

- save record
- get record
- search records
- update record
- append history event

### Reload hydration contract

A hydration contract exists for the future authenticated transport layer.

It remains fail-closed until a configured persistent repository is supplied.

## What is NOT yet true

No managed PostgreSQL database has been provisioned or attached by this pack.

Therefore:

- production database connected = no
- migration applied to production = no
- durable browser persistence active = no
- reload survival proven against a live database = no
- Tower transport connected = no
- Vault connected = no
- money movement = no
- deployment = no

## Next pack

TINT011–TINT020 will connect a real managed PostgreSQL database, run the migration, verify RLS and transactions against the live database, and prove a Teller record can be written, the process restarted, and the same record loaded again.

Tower remains identity and permission authority.

Teller owns its workflow records.

Vault remains sealed proof through Tower only.
