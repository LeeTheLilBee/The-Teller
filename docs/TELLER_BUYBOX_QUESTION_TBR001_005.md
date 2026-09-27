# TBR001–005 — Teller's own BuyBox proposed-terms intake boundary

Source-only change on Teller's dedicated development branch, not a new
hosted API or a buy/finance approval. It reads the actual frozen proposed
packet from BuyBox BBX027–031, whose source version is
8c93f7e882d216048b6a86370e28f174d7e4dc90.

The parser validates the exact versioned route-via-Tower shape; seven
vertical IDs; stored source revision and digest; five strictly formatted
money-like proposal strings; mission-account lane separation; terms
reference, canonical SHA-256 terms fingerprint and a bounded 300-second
timestamp window. It refuses extra READY, balance, receipt or forged
authorization fields. The CI job generates an actual synthetic question
using the independently pinned BuyBox Python source, then parses it using
Teller's Node module; no copied source terms are used as a fake issuer.

A format match or SHA-256 fingerprint is not authenticated identity,
current opportunity truth, a Tower approval, money-side readiness or
management capacity. Every result is UNTRUSTED_QUESTION_HOLD, UNKNOWN
for both money and capacity, no issuer receipt, no deployment of funds,
no invoice/checkout, no OBSERVATORY balance access and no external call.

Next separately reviewed Teller work must consume current server-derived
Tower identity/entity/purpose and authenticated saved opportunity revision,
then obtain actual relevant capital and operating-capacity constraints from
Teller's authoritative money-administration systems. ATM_SET_1_ACQUISITION
and ATM_SET_2_ACQUISITION remain separate, with no cross-sleeve pooling,
no assumption that projected OB profits are spendable, and no reduction
in protected floors. A fresh actual Teller issuer-bound receipt needs deal
terms, source fingerprint, expiry, revocation and a separate verification
contract before BuyBox can display real readiness.

No new paid Render, DB, payment-provider, broker connection, secret or live
financial action. Product beta and provider selection still require owner
approval. This source layer intentionally does not issue READY under any input.
