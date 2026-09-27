import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  QUESTION_VERSION, BuyBoxReadinessQuestionError,
  inspectUntrustedBuyBoxReadinessQuestion,
} from "../server/teller/readiness/tellerBuyBoxQuestionV1.js";

const NOW = 2_000_000_000;
function stable(value) {
  if (Array.isArray(value)) return "[" + value.map(stable).join(",") + "]";
  if (value !== null && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(
      (key) => JSON.stringify(key) + ":" + stable(value[key])
    ).join(",") + "}";
  }
  return JSON.stringify(value);
}
function synth() {
  const packet = {
    schema_version: QUESTION_VERSION,
    source_app: "buybox", route_via: "tower", destination: "teller",
    requested_action: "REQUEST_TELLER_READINESS", purpose: "acquisition_financing",
    opportunity_id: "synthetic-opportunity", opportunity_revision: 1,
    input_snapshot_digest: "a".repeat(64), vertical_id: "atm",
    stored_asking_price: "95000.00",
    terms: {
      proposed_purchase_price: "95000.00",
      proposed_debt_amount: "75000.00",
      proposed_equity_amount: "20000.00",
      estimated_closing_costs: "5000.00",
      proposed_reserve: "12000.00",
      funding_lane: "ATM_SET_1_ACQUISITION",
      terms_reference: "synthetic-proposal",
    },
    issued_at: new Date(NOW * 1000).toISOString(),
    valid_until: new Date((NOW + 120) * 1000).toISOString(),
  };
  packet.terms_fingerprint = createHash("sha256").update(stable({
    opportunity_id: packet.opportunity_id,
    opportunity_revision: packet.opportunity_revision,
    input_snapshot_digest: packet.input_snapshot_digest,
    vertical_id: packet.vertical_id,
    stored_asking_price: packet.stored_asking_price,
    terms: packet.terms,
  })).digest("hex");
  return packet;
}
function originalQuestion() {
  return process.env.TELLER_PINNED_BUYBOX_QUESTION
    ? JSON.parse(readFileSync(process.env.TELLER_PINNED_BUYBOX_QUESTION, "utf8"))
    : synth();
}
function inspect(packet, now = NOW) {
  return inspectUntrustedBuyBoxReadinessQuestion(packet, { nowEpochSeconds: now });
}
function denied(packet, code) {
  assert.throws(() => inspect(packet), (err) =>
    err instanceof BuyBoxReadinessQuestionError && err.code === code);
}

test("exact Python BuyBox question accepted only as an untrusted HOLD", () => {
  const packet = originalQuestion();
  const result = inspect(packet);
  assert.equal(result.schema_version, "teller.buybox.readiness.review.v1");
  assert.equal(result.state, "UNTRUSTED_QUESTION_HOLD");
  assert.equal(result.terms_fingerprint, packet.terms_fingerprint);
  assert.equal(result.money_readiness, "UNKNOWN");
  assert.equal(result.management_capacity_readiness, "UNKNOWN");
  assert.equal(result.teller_readiness, "UNKNOWN");
  for (const field of [
    "tower_actor_verified", "canonical_opportunity_verified",
    "atm_protected_floors_verified", "issuer_receipt_present",
    "capital_transfer_authorized", "acquisition_authorized",
    "external_call_made", "amount_values_returned",
  ]) assert.equal(result[field], false);
  const output = JSON.stringify(result);
  assert.ok(!output.includes("75000.00"));
  assert.ok(!output.includes("broker_balance"));
});
test("Set 1 versus Set 2 cannot silently pool and nobody fabricates READY", () => {
  const first = originalQuestion();
  const second = structuredClone(first);
  second.terms.funding_lane = "ATM_SET_2_ACQUISITION";
  denied(second, "QUESTION_FINGERPRINT_MISMATCH");
  const pooled = structuredClone(first);
  pooled.terms.funding_lane = "ATM_SET_1_PLUS_SET_2";
  denied(pooled, "UNVERIFIED_FUNDING_LANE_NOT_ALLOWED");
  const approval = {...first, teller_readiness: "READY"};
  denied(approval, "QUESTION_FIELDS_INVALID");
});
test("tampered deal terms or opportunity revision invalidate fingerprint", () => {
  for (const patch of [
    (p) => { p.terms.proposed_equity_amount = "21000.00"; },
    (p) => { p.input_snapshot_digest = "b".repeat(64); },
    (p) => { p.opportunity_revision = 2; },
    (p) => { p.stored_asking_price = "90000.00"; },
  ]) {
    const p = structuredClone(originalQuestion()); patch(p);
    denied(p, "QUESTION_FINGERPRINT_MISMATCH");
  }
});
test("route, amount, Lane, expired and invalid identity fail closed", () => {
  for (const [patch, code] of [
    [(p) => { p.route_via = "observatory"; }, "QUESTION_ROUTE_INVALID"],
    [(p) => { p.terms.proposed_equity_amount = 20000; }, "MONEY_FORMAT_INVALID"],
    [(p) => { p.terms.proposed_debt_amount = "-1.00"; }, "MONEY_FORMAT_INVALID"],
    [(p) => { p.terms.proposed_reserve = "1e9"; }, "MONEY_FORMAT_INVALID"],
    [(p) => { p.terms.terms_reference = "../fake"; }, "TERMS_REFERENCE_INVALID"],
    [(p) => { p.vertical_id = "weapons"; }, "QUESTION_VERTICAL_INVALID"],
    [(p) => { p.terms.funding_lane = "GROUNDS_ACQUISITION_UNVERIFIED"; }, "UNVERIFIED_FUNDING_LANE_NOT_ALLOWED"],
    [(p) => { p.issued_at = "2033-05-18T03:33:20"; }, "TIMEZONE_TIMESTAMP_REQUIRED"],
    [(p) => { p.valid_until = p.issued_at; }, "QUESTION_TIME_INVALID"],
    [(p) => { p.valid_until = new Date((NOW + 301)*1000).toISOString(); }, "QUESTION_TIME_INVALID"],
    [(p) => { p.opportunity_revision = true; }, "QUESTION_REVISION_INVALID"],
  ]) {
    const p = structuredClone(originalQuestion()); patch(p); denied(p, code);
  }
  const expired = inspect(originalQuestion(), NOW + 121);
  assert.equal(expired.state, "UNTRUSTED_QUESTION_HOLD");
  assert.ok(expired.reason_codes.includes("LOCAL_TERMS_QUESTION_EXPIRED"));
});
test("no web route, direct OB dependency or outcome issuer is added", () => {
  const source = readFileSync(new URL("../server/teller/readiness/tellerBuyBoxQuestionV1.js", import.meta.url), "utf8");
  for (const forbidden of ["fetch(", "axios.", "from \"observatory", "capitalTransfer(", "app.post(", "READY\";"]) {
    assert.ok(!source.includes(forbidden), forbidden);
  }
});
