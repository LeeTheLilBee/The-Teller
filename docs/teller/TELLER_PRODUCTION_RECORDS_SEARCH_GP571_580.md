# The Teller — GP571–GP580
## Production Records + Search

This pack creates Teller's production-record boundary and a usable records-search surface.

## What works now

Every form workflow prepared through Forms & Requests creates a normalized Teller session record.

That record can be found from the global Search doorway.

Search supports:

- free-text record search
- category
- status
- business
- workflow metadata

## Search privacy boundary

Search indexes safe record metadata only.

It does not index the raw workflow payload.

The safe search projection contains fields such as:

- record title
- form ID
- workflow type
- category
- business key
- record status

## Record payload

A prepared record may retain workflow values in session memory.

Before the record envelope is created, forbidden credential keys are removed.

Blocked keys include:

- SSN
- TIN / EIN
- bank account number
- routing number
- card number
- CVV
- password / PIN
- passport number
- driver's-license number
- identity-document number

## Production repository boundary

The repository interface exists for:

- save
- get
- search
- update

The default repository is intentionally unconfigured.

No fake backend exists.

Therefore:

- session records are searchable
- production persistence is not connected
- closing/reloading the app may discard session records
- Teller does not claim a record was permanently saved

## Record history

The canonical model includes audit-history events and timestamps.

This becomes the basis for future:

- corrections
- approvals
- status transitions
- record history
- safe audit views

## Global Search

The Teller header now has:

- + New
- Scan
- Search

Search opens the Records & Search workspace.

## Locked architecture

Tower is the face.

Teller is the workflow.

Vault is the sealed memory.

Teller can ask. Tower must decide. Vault only answers Tower.
