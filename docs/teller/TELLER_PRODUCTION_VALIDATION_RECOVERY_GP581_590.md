# The Teller — GP581–GP590
## Production Validation + Recovery

This pack adds Teller's reliability layer.

## Validation

Every prepared session record must pass production-shape validation before App accepts it.

Validation checks include:

- record ID
- record version
- source
- status
- search projection
- false production-persistence claims
- forbidden credential keys in payloads

## Duplicate preparation

Prepared forms receive a deterministic, sanitized submission fingerprint.

If the same workflow values are prepared again during the active Teller session, App blocks the duplicate record.

This does not depend on a browser database.

## Corrections

Manager / Owner Recovery Center controls can move a session record into:

`needs_correction`

The correction reason is added to record history.

Clearing correction returns the session record to `prepared`.

## Workflow locks

Teller can apply a session workflow lock to a record while it is under review.

This is explicitly not a Tower security lock.

Tower remains permission authority.

## Retry state

A retry-state contract now exists for future production operations:

- ready
- running
- retryable
- failed
- blocked
- complete

No network retry or transport is connected yet.

## Recovery point

Recovery Center can create an in-memory recovery snapshot of the current valid record set.

The recovery point can restore records while the current app session remains alive.

It does not survive:

- refresh
- browser close
- device restart

That requires the future production repository.

## Recovery events

App records session reliability events such as:

- record accepted
- record validation blocked
- duplicate preparation blocked
- session records recovered

## Records & Search

Recovery Center lives inside Records & Search.

It does not create another broad dashboard.

## Production truth

Production repository remains unconfigured.

There is still:

- no localStorage record database
- no sessionStorage record database
- no IndexedDB record database
- no fake permanent autosave
- no direct Tower API
- no direct Vault

## Locked architecture

Tower is the face.

Teller is the workflow.

Vault is the sealed memory.

Teller can ask. Tower must decide. Vault only answers Tower.
