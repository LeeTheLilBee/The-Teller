/**
 * TBR001–005: independently parse BuyBox's proposed acquisition terms.
 *
 * Shape and SHA256 checks are NOT authenticated Tower transport, Teller money
 * or capacity evidence, protected-floor verification, underwriting approval,
 * a payment, or an executable acquisition. No READY outcome exists here.
 */
import { createHash } from "node:crypto";

export const QUESTION_VERSION = "buybox.teller.readiness.question.v1";
export const MAX_QUESTION_SECONDS = 300;
const VERTICALS = new Set([
  "atm", "multifamily", "commercial", "laundromat",
  "land_farm", "business", "equipment",
]);
const MONEY = [
  "proposed_purchase_price", "proposed_debt_amount",
  "proposed_equity_amount", "estimated_closing_costs", "proposed_reserve",
];
const TERM_FIELDS = [...MONEY, "funding_lane", "terms_reference"];
const FIELDS = [
  "schema_version", "source_app", "route_via", "destination",
  "requested_action", "purpose", "opportunity_id", "opportunity_revision",
  "input_snapshot_digest", "vertical_id", "stored_asking_price",
  "terms", "terms_fingerprint", "issued_at", "valid_until",
];
const REF = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const SHA = /^[0-9a-f]{64}$/;
const AMOUNT = /^(0|[1-9][0-9]*)(?:\.([0-9]{1,2}))?$/;
const MAX_CENTS = 100000000000000n;
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export class BuyBoxReadinessQuestionError extends Error {
  constructor(code) {
    super(code);
    this.name = "BuyBoxReadinessQuestionError";
    this.code = code;
  }
}
function deny(code) { throw new BuyBoxReadinessQuestionError(code); }
function objectWithExactly(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Object.keys(value);
  return actual.length === keys.length &&
    keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}
function canonical(value) {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object") {
    return "{" + Object.keys(value).sort().map(
      (key) => JSON.stringify(key) + ":" + canonical(value[key])
    ).join(",") + "}";
  }
  return JSON.stringify(value);
}
function amount(value, positive) {
  if (typeof value !== "string" || value.length > 30) deny("MONEY_FORMAT_INVALID");
  const match = AMOUNT.exec(value);
  if (!match) deny("MONEY_FORMAT_INVALID");
  const parts = value.split(".");
  const cents = BigInt(parts[0]) * 100n +
    BigInt((parts[1] || "").padEnd(2, "0") || "0");
  if (cents > MAX_CENTS || (positive ? cents <= 0n : cents < 0n)) {
    deny("MONEY_RANGE_INVALID");
  }
  return cents.toString(); // Internal compare only. No amount is returned.
}
function timestamp(value) {
  if (typeof value !== "string" || !ISO_WITH_ZONE.test(value)) {
    deny("TIMEZONE_TIMESTAMP_REQUIRED");
  }
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) deny("TIMEZONE_TIMESTAMP_REQUIRED");
  return milliseconds;
}
function lane(vertical) {
  if (vertical === "atm") return ["ATM_SET_1_ACQUISITION", "ATM_SET_2_ACQUISITION"];
  if (vertical === "multifamily") return ["GROUNDS_ACQUISITION_UNVERIFIED"];
  return ["MISSION_ACCOUNT_UNASSIGNED"];
}
function validateCore(packet) {
  if (!objectWithExactly(packet, FIELDS)) deny("QUESTION_FIELDS_INVALID");
  if (
    packet.schema_version !== QUESTION_VERSION ||
    packet.source_app !== "buybox" || packet.route_via !== "tower" ||
    packet.destination !== "teller" ||
    packet.requested_action !== "REQUEST_TELLER_READINESS" ||
    packet.purpose !== "acquisition_financing"
  ) deny("QUESTION_ROUTE_INVALID");
  if (typeof packet.opportunity_id !== "string" || !REF.test(packet.opportunity_id)) {
    deny("QUESTION_OPPORTUNITY_INVALID");
  }
  if (!Number.isSafeInteger(packet.opportunity_revision) ||
      packet.opportunity_revision <= 0) deny("QUESTION_REVISION_INVALID");
  if (typeof packet.input_snapshot_digest !== "string" ||
      !SHA.test(packet.input_snapshot_digest)) deny("QUESTION_DIGEST_INVALID");
  if (!VERTICALS.has(packet.vertical_id)) deny("QUESTION_VERTICAL_INVALID");
  if (!objectWithExactly(packet.terms, TERM_FIELDS)) deny("EXACT_PROPOSED_TERMS_REQUIRED");
  for (const field of MONEY) {
    const cents = amount(packet.terms[field], field === "proposed_purchase_price");
    const v = packet.terms[field];
    if (v !== (cents / 100n).toString() + "." + (cents % 100n).toString().padStart(2, "0")) {
      deny("QUESTION_TERMS_NOT_CANONICAL");
    }
  }
  if (packet.stored_asking_price !== null) {
    const cents = amount(packet.stored_asking_price, false);
    if (packet.stored_asking_price !== (cents / 100n).toString() + "." +
        (cents % 100n).toString().padStart(2, "0")) deny("QUESTION_ASKING_PRICE_INVALID");
  }
  if (!lane(packet.vertical_id).includes(packet.terms.funding_lane)) {
    deny("UNVERIFIED_FUNDING_LANE_NOT_ALLOWED");
  }
  if (typeof packet.terms.terms_reference !== "string" ||
      !REF.test(packet.terms.terms_reference)) deny("TERMS_REFERENCE_INVALID");
  const core = {
    opportunity_id: packet.opportunity_id,
    opportunity_revision: packet.opportunity_revision,
    input_snapshot_digest: packet.input_snapshot_digest,
    vertical_id: packet.vertical_id,
    stored_asking_price: packet.stored_asking_price,
    terms: packet.terms,
  };
  const calculated = createHash("sha256").update(canonical(core), "utf8").digest("hex");
  if (typeof packet.terms_fingerprint !== "string" ||
      !SHA.test(packet.terms_fingerprint) || packet.terms_fingerprint !== calculated) {
    deny("QUESTION_FINGERPRINT_MISMATCH");
  }
  return calculated;
}

/**
 * This checks only the untrusted BuyBox packet's local source/term shape.
 * A real API must separately re-fetch the canonical opportunity under Tower
 * authorization, verify current scope and ask Teller's financial/capacity
 * engine. No arbitrary packet can create an authority or readiness receipt.
 */
export function inspectUntrustedBuyBoxReadinessQuestion(packet, {
  nowEpochSeconds = Math.floor(Date.now() / 1000),
} = {}) {
  if (!Number.isSafeInteger(nowEpochSeconds)) deny("EVALUATION_TIME_INVALID");
  const fingerprint = validateCore(packet);
  const issued = timestamp(packet.issued_at);
  const expires = timestamp(packet.valid_until);
  const now = nowEpochSeconds * 1000;
  if (issued > now + 30000 || expires <= issued ||
      expires - issued > MAX_QUESTION_SECONDS * 1000) {
    deny("QUESTION_TIME_INVALID");
  }
  const reasons = [
    "TRUSTED_TOWER_IDENTITY_ENTITY_AND_PURPOSE_UNVERIFIED",
    "CURRENT_BUYBOX_SOURCE_REVISION_NOT_INDEPENDENTLY_VERIFIED",
    "TELLER_MONEY_AND_MANAGEMENT_CAPACITY_NOT_EVALUATED",
    "ATM_SET_PROTECTED_FLOORS_NOT_VERIFIED",
    "TELLER_RECEIPT_ISSUER_AND_TRANSPORT_NOT_CONNECTED",
  ];
  if (now >= expires) reasons.push("LOCAL_TERMS_QUESTION_EXPIRED");
  return Object.freeze({
    schema_version: "teller.buybox.readiness.review.v1",
    state: "UNTRUSTED_QUESTION_HOLD",
    terms_fingerprint: fingerprint,
    reason_codes: Object.freeze(reasons),
    tower_actor_verified: false,
    canonical_opportunity_verified: false,
    money_readiness: "UNKNOWN",
    management_capacity_readiness: "UNKNOWN",
    teller_readiness: "UNKNOWN",
    atm_protected_floors_verified: false,
    issuer_receipt_present: false,
    capital_transfer_authorized: false,
    acquisition_authorized: false,
    external_call_made: false,
    amount_values_returned: false,
  });
}
