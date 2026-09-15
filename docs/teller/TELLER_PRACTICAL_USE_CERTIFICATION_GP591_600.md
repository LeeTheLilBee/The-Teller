# The Teller — GP591–GP600
## Practical-Use Certification

This pack closes the current Teller production-preparation lane.

It certifies what the source product can actually do today and explicitly separates that from integrations that do not exist yet.

## Certified practical-use source lanes

### Access boundary

- Teller requires a Tower-issued runtime session.
- Employee, Manager, and Owner roles remain separate.
- No local pretend Tower workspace is used.

### Forms & Requests

Teller has one reusable Forms Engine with role filtering and progressive workflow support.

Practical lanes include:

- employee/contact workflows
- people/employment intake
- payroll/payment intake
- reimbursement
- vendor intake
- invoice intake
- document requests
- document replacement
- document verification

### Capture

The global `Scan` action supports browser:

- camera image selection
- JPG
- PNG
- WEBP
- PDF

Capture includes:

- validation
- local SHA-256 document fingerprinting
- session duplicate detection
- human document-type confirmation
- provider-neutral OCR boundary
- human field verification
- verified autofill packet

Teller does not invent extracted values when OCR is unavailable.

### Records & Search

Prepared Teller workflows create canonical session records.

Records support:

- safe metadata-only search
- text search
- category filter
- status filter
- business filter
- audit history

Protected workflow payload values are not indexed into search.

### Reliability

Teller now includes:

- production-shape record validation
- forbidden credential-key validation
- duplicate prepared-workflow protection
- correction workflow
- retry-state model
- session workflow locks
- in-memory recovery points
- recovery event tracking

## Practical-use certification boundary

The source lane is certified for practical workflow use.

That does **not** mean the complete production platform is connected.

## Still blocked pending integration

The following are intentionally not certified as complete:

- production record repository
- production OCR provider
- payroll processor
- payment processor
- real money movement
- reload-safe persistence
- Tower transport/API
- Tower-mediated Vault transport/storage

## Deployment

Deployment is not authorized by this pack.

This pack performs:

- source checks
- executable scenario checks
- regression checks
- production build verification

It performs no deployment or promotion.

## Security doctrine preserved

Tower is the face.

Teller is the workflow.

Vault is the sealed memory.

Teller can ask.

Tower must decide.

Vault only answers Tower.

## Current global Teller actions

- `+ New`
- `Scan`
- `Search`

## Certification result vocabulary

`CERTIFIED`

means the source workflow exists and passed this practical-use certification.

`BLOCKED_PENDING_INTEGRATION`

means the product architecture is ready for a future external/production connection but the connection is not currently installed.

`NOT_AUTHORIZED`

means the action is outside this pack's authority.

The practical-use source lane can close without falsely claiming the unfinished integration lane is finished.
