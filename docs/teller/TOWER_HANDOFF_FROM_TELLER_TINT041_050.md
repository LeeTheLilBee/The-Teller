
# Teller → Tower Handoff — TINT041–TINT050

This is a Teller-side handoff only.

Teller does not modify Tower.

## Teller is now fail-closed for hosted persistence

The browser persistence transport activates only when Teller has:

- a live `window.__TELLER_TOWER_SESSION__`
- Tower session ID
- Tower receipt ID
- actor ID
- business key
- allowed Teller role
- `persistence_access_token`
- HTTPS hosted Teller API URL

The token must retain the previously sealed `tpt1` contract.

## Important

Teller's historical UI session-storage fallback does not qualify as persistence authority.

Do not attempt to solve the hosted crossing by putting the Teller persistence token into:

- query parameters
- URL fragments
- localStorage
- sessionStorage

## What Tower needs to prove

Tower must prove how the real hosted launch delivers the authorized Teller session and persistence credential to the hosted Teller runtime.

If the separate-origin launch cannot safely preserve the current live-window injection contract, Tower should stop and return a precise requirement for a one-time bootstrap/exchange protocol.

Do not improvise a weaker browser credential path.

## Teller remains waiting

The hosted Teller static site has not been activated against the hosted API yet.

## Teller Seal

TINT041–TINT050 is now sealed from:

`13b21ef5b39974c06857ca60bf8427fcf90435cc`

Tower should treat this Teller contract as stable until a precise Tower → Teller handoff requires another Teller-side change.

